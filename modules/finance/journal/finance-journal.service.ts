import { createHash } from 'node:crypto';
import type { ClientSession } from 'mongoose';
import { Types } from 'mongoose';
import { FinanceDomainError } from '../finance.error';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import {
  FinanceAccountRepository,
  type FinanceAccountPersistenceRecord,
} from '../accounts/finance-account.repository';
import type {
  FinanceJournalReversalDTO,
  FinanceJournalPostResultDTO,
  FinanceOperationalPostingDTO,
} from './finance-journal.dto';
import { mapFinanceJournalEntry } from './finance-journal.mapper';
import {
  FinanceJournalRepository,
  type CreateFinanceJournalRecord,
  type FinanceJournalPersistenceRecord,
} from './finance-journal.repository';
import { FinancePeriodService } from '../periods/finance-period.service';
import {
  FinanceJournalReversalSchema,
  FinanceOperationalPostingSchema,
} from './finance-journal.schema';

type FinanceJournalRepositoryPort = Pick<
  FinanceJournalRepository,
  | 'findByIdempotencyKey'
  | 'createPosted'
  | 'findEntryById'
  | 'findByReversalOf'
  | 'markReversed'
>;

type FinanceAccountRepositoryPort = Pick<
  FinanceAccountRepository,
  'findSelectableByIds'
>;

type FinancePeriodServicePort = Pick<
  FinancePeriodService,
  'ensureOpen' | 'getPeriodKey'
>;

const getFingerprint = (
  data: FinanceOperationalPostingDTO
) =>
  createHash('sha256')
    .update(
      JSON.stringify({
        ...data,
        transaction_date:
          data.transaction_date.toISOString(),
        posting_date: (
          data.posting_date ?? data.transaction_date
        ).toISOString(),
      })
    )
    .digest('hex');

const isDuplicateKeyError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;
  if (!('code' in error)) return false;
  return (error as { code?: unknown }).code === 11000;
};

const toAccountIds = (
  records: FinanceAccountPersistenceRecord[]
) => new Set(records.map((record) => String(record._id)));

export class FinanceJournalService {
  private readonly journalRepository: FinanceJournalRepositoryPort;
  private readonly accountRepository: FinanceAccountRepositoryPort;
  private readonly periodService: FinancePeriodServicePort;
  private readonly context: FinanceTenantContext;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      journalRepository?: FinanceJournalRepositoryPort;
      accountRepository?: FinanceAccountRepositoryPort;
      periodService?: FinancePeriodServicePort;
    }
  ) {
    assertFinanceTenant(context);
    this.context = context;
    this.journalRepository =
      dependencies?.journalRepository ??
      new FinanceJournalRepository(context);
    this.accountRepository =
      dependencies?.accountRepository ??
      new FinanceAccountRepository(context);
    this.periodService =
      dependencies?.periodService ??
      new FinancePeriodService(context);
  }

  async postOperational(
    input: FinanceOperationalPostingDTO | unknown,
    session?: ClientSession
  ): Promise<FinanceJournalPostResultDTO> {
    return this.postOperationalInternal(input, session);
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
    session?: ClientSession
  ): Promise<FinanceJournalPostResultDTO | null> {
    const existing =
      await this.journalRepository.findByIdempotencyKey(
        idempotencyKey,
        session
      );
    if (!existing) return null;

    return {
      journal_entry: mapFinanceJournalEntry(existing),
      replayed: true,
    };
  }

  async reverse(
    journalEntryId: string,
    input: FinanceJournalReversalDTO | unknown,
    session?: ClientSession
  ): Promise<FinanceJournalPostResultDTO> {
    const data = FinanceJournalReversalSchema.parse(input);

    if (!Types.ObjectId.isValid(journalEntryId)) {
      throw new FinanceDomainError(
        'Journal Finance tidak ditemukan.',
        'FINANCE_JOURNAL_NOT_FOUND'
      );
    }

    const original =
      await this.journalRepository.findEntryById(
        journalEntryId,
        session
      );
    if (!original) {
      throw new FinanceDomainError(
        'Journal Finance tidak ditemukan.',
        'FINANCE_JOURNAL_NOT_FOUND'
      );
    }

    const existingReversal =
      await this.journalRepository.findByReversalOf(
        journalEntryId,
        session
      );
    if (existingReversal) {
      if (original.status === 'posted') {
        await this.journalRepository.markReversed(
          journalEntryId,
          session
        );
      }
      return {
        journal_entry: mapFinanceJournalEntry(
          existingReversal
        ),
        replayed: true,
      };
    }

    if (original.status === 'reversed') {
      throw new FinanceDomainError(
        'Journal Finance sudah reversed tetapi reversal entry tidak ditemukan.',
        'FINANCE_JOURNAL_REVERSAL_CONFLICT'
      );
    }

    if (original.status !== 'posted') {
      throw new FinanceDomainError(
        'Hanya journal Finance posted yang dapat direverse.',
        'FINANCE_JOURNAL_NOT_REVERSIBLE'
      );
    }

    const effectiveDate = data.effective_date ?? new Date();
    const period = await this.periodService.getPeriodKey(
      effectiveDate,
      session
    );
    const idempotencyKey =
      data.idempotency_key ??
      `journal-reversal:${String(original._id)}:${period}`;
    const result = await this.postOperationalInternal(
      {
        transaction_date: effectiveDate,
        posting_date: effectiveDate,
        currency: original.currency,
        description:
          data.description ??
          `Reversal ${original.entry_number}: ${original.description}`,
        source_type: 'journal_reversal',
        source_id: String(original._id),
        source_event: 'reversal',
        idempotency_key: idempotencyKey,
        lines: original.lines.map((line) => ({
          account_id: String(line.account_id),
          debit: line.credit,
          credit: line.debit,
          ...(line.description
            ? { description: line.description }
            : {}),
          ...(line.dimensions
            ? { dimensions: line.dimensions }
            : {}),
        })),
      },
      session,
      journalEntryId
    );

    if (
      result.journal_entry.reversal_of !== journalEntryId
    ) {
      throw new FinanceDomainError(
        'Idempotency key reversal sudah digunakan oleh journal lain.',
        'FINANCE_JOURNAL_REVERSAL_CONFLICT'
      );
    }

    const marked =
      await this.journalRepository.markReversed(
        journalEntryId,
        session
      );
    if (!marked) {
      const latest =
        await this.journalRepository.findEntryById(
          journalEntryId,
          session
        );
      if (latest?.status !== 'reversed') {
        throw new FinanceDomainError(
          'Reversal berhasil dibuat tetapi journal original gagal ditandai reversed.',
          'FINANCE_JOURNAL_REVERSAL_FINALIZATION_FAILED'
        );
      }
    }

    return result;
  }

  private async postOperationalInternal(
    input: FinanceOperationalPostingDTO | unknown,
    session?: ClientSession,
    reversalOf?: string
  ): Promise<FinanceJournalPostResultDTO> {
    const data =
      FinanceOperationalPostingSchema.parse(input);
    const idempotencyHash = getFingerprint(data);
    const existing =
      await this.journalRepository.findByIdempotencyKey(
        data.idempotency_key,
        session
      );

    if (existing) {
      return this.resolveExisting(
        existing,
        idempotencyHash
      );
    }

    const period = await this.periodService.getPeriodKey(
      data.transaction_date,
      session
    );
    await this.periodService.ensureOpen(
      period,
      data.transaction_date,
      session
    );

    const accountIds = data.lines.map(
      (line) => line.account_id
    );
    const uniqueAccountIds = [...new Set(accountIds)];

    if (
      uniqueAccountIds.some(
        (accountId) => !Types.ObjectId.isValid(accountId)
      )
    ) {
      throw new FinanceDomainError(
        'Semua account pada journal harus berupa ObjectId yang valid.',
        'FINANCE_JOURNAL_ACCOUNT_NOT_SELECTABLE'
      );
    }

    const selectableAccounts =
      await this.accountRepository.findSelectableByIds(
        uniqueAccountIds,
        session
      );
    const selectableAccountIds = toAccountIds(
      selectableAccounts
    );

    if (
      uniqueAccountIds.some(
        (accountId) => !selectableAccountIds.has(accountId)
      )
    ) {
      throw new FinanceDomainError(
        'Semua account pada journal harus aktif dan dapat digunakan untuk posting.',
        'FINANCE_JOURNAL_ACCOUNT_NOT_SELECTABLE'
      );
    }

    const postingDate =
      data.posting_date ?? data.transaction_date;
    const postedAt = new Date();
    const record: CreateFinanceJournalRecord = {
      entry_number: `FIN-${new Types.ObjectId().toHexString()}`,
      transaction_date: data.transaction_date,
      posting_date: postingDate,
      period,
      currency: data.currency,
      description: data.description,
      source_type: data.source_type,
      source_id: data.source_id,
      source_event: data.source_event,
      idempotency_key: data.idempotency_key,
      idempotency_hash: idempotencyHash,
      status: 'posted',
      posted_at: postedAt,
      ...(this.context.userId &&
      Types.ObjectId.isValid(this.context.userId)
        ? {
            posted_by: new Types.ObjectId(
              this.context.userId
            ),
          }
        : {}),
      ...(reversalOf
        ? { reversal_of: new Types.ObjectId(reversalOf) }
        : {}),
      lines: data.lines.map((line) => ({
        account_id: new Types.ObjectId(line.account_id),
        debit: line.debit,
        credit: line.credit,
        ...(line.description
          ? { description: line.description }
          : {}),
        ...(line.dimensions
          ? { dimensions: line.dimensions }
          : {}),
      })),
    };

    try {
      const created =
        await this.journalRepository.createPosted(
          record,
          session
        );
      return {
        journal_entry: mapFinanceJournalEntry(created),
        replayed: false,
      };
    } catch (error: unknown) {
      if (!isDuplicateKeyError(error)) throw error;

      const raced =
        await this.journalRepository.findByIdempotencyKey(
          data.idempotency_key,
          session
        );
      if (raced) {
        return this.resolveExisting(raced, idempotencyHash);
      }

      throw new FinanceDomainError(
        'Journal gagal dibuat karena konflik data.',
        'FINANCE_JOURNAL_CREATE_CONFLICT'
      );
    }
  }

  private resolveExisting(
    existing: FinanceJournalPersistenceRecord,
    idempotencyHash: string
  ): FinanceJournalPostResultDTO {
    if (existing.idempotency_hash !== idempotencyHash) {
      throw new FinanceDomainError(
        'Idempotency key sudah digunakan untuk payload journal yang berbeda.',
        'FINANCE_JOURNAL_IDEMPOTENCY_CONFLICT'
      );
    }

    return {
      journal_entry: mapFinanceJournalEntry(existing),
      replayed: true,
    };
  }
}
