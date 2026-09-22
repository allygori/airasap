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
  FinanceJournalPostResultDTO,
  FinanceOperationalPostingDTO,
} from './finance-journal.dto';
import { mapFinanceJournalEntry } from './finance-journal.mapper';
import {
  FinanceJournalRepository,
  type CreateFinanceJournalRecord,
  type FinanceJournalPersistenceRecord,
} from './finance-journal.repository';
import { FinanceOperationalPostingSchema } from './finance-journal.schema';

type FinanceJournalRepositoryPort = Pick<
  FinanceJournalRepository,
  'findByIdempotencyKey' | 'createPosted'
>;

type FinanceAccountRepositoryPort = Pick<
  FinanceAccountRepository,
  'findSelectableByIds'
>;

const getPeriodKey = (date: Date) =>
  `${date.getUTCFullYear()}-${String(
    date.getUTCMonth() + 1
  ).padStart(2, '0')}`;

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
  private readonly context: FinanceTenantContext;

  constructor(
    context: FinanceTenantContext,
    dependencies?: {
      journalRepository?: FinanceJournalRepositoryPort;
      accountRepository?: FinanceAccountRepositoryPort;
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
  }

  async postOperational(
    input: FinanceOperationalPostingDTO | unknown,
    session?: ClientSession
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
      period: getPeriodKey(data.transaction_date),
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
