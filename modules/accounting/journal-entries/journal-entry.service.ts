import type { ClientSession, Types } from 'mongoose';
import { CreateJournalEntrySchema } from './journal-entry.schema';
import type {
  CreateJournalEntryDTO,
  JournalLineDTO,
} from './journal-entry.dto';
import { JournalEntryRepository } from './journal-entry.repository';
import { AccountingAccountRepository } from '../accounts/account.repository';
import { AccountingPeriodService } from '../periods/accounting-period.service';
import { AccountingDomainError } from '../accounting.error';
import {
  assertAccountingTenant,
  getPeriodKeyFromDate,
  parseAccountingDate,
  toAccountingObjectId,
  validateSourceReference,
  type AccountingTenantContext,
} from '../accounting.types';
import { createAuditLog } from '../audit/audit-log.model';

type ReversalInput = {
  reversal_entry_number?: string;
  effective_date: string;
  period?: string;
  description?: string;
  idempotency_key?: string;
};

type JournalLineForValidation = {
  account: string | Types.ObjectId;
  debit: number;
  credit: number;
};

export class JournalEntryService {
  private readonly repository: JournalEntryRepository;
  private readonly accountRepository: AccountingAccountRepository;
  private readonly periodService: AccountingPeriodService;
  private readonly context: AccountingTenantContext;

  constructor(context: AccountingTenantContext) {
    assertAccountingTenant(context);
    this.context = context;
    this.repository = new JournalEntryRepository(context);
    this.accountRepository =
      new AccountingAccountRepository(context);
    this.periodService = new AccountingPeriodService(
      context
    );
  }

  async createDraft(
    input: unknown,
    session?: ClientSession
  ) {
    const data = CreateJournalEntrySchema.parse(input);

    if (data.status !== 'draft') {
      throw new AccountingDomainError(
        'Journal entry baru harus dibuat sebagai draft.',
        'JOURNAL_MUST_START_AS_DRAFT'
      );
    }

    validateSourceReference(data);
    await this.validateAccounts(data.lines, session);

    if (data.idempotency_key) {
      const existing =
        await this.repository.findByIdempotencyKey(
          data.idempotency_key,
          session
        );
      if (existing) return existing;
    }

    return this.repository.createEntry(
      {
        entry_number: data.entry_number,
        transaction_date: parseAccountingDate(
          data.transaction_date,
          'transaction_date'
        ),
        posting_date: parseAccountingDate(
          data.posting_date,
          'posting_date'
        ),
        period: data.period,
        currency: data.currency,
        description: data.description,
        source_type: data.source_type,
        source_id: data.source_id,
        source_event: data.source_event,
        idempotency_key: data.idempotency_key,
        status: 'draft',
        lines: data.lines,
      },
      session
    );
  }

  async post(
    journalEntryId: string,
    postedBy?: string,
    session?: ClientSession
  ) {
    const entry = await this.repository.findEntryById(
      journalEntryId,
      session
    );
    if (!entry) {
      throw new AccountingDomainError(
        'Journal entry tidak ditemukan.',
        'JOURNAL_NOT_FOUND'
      );
    }

    if (entry.status === 'posted') return entry;
    if (entry.status === 'reversed') {
      throw new AccountingDomainError(
        'Journal entry yang sudah reversed tidak dapat diposting ulang.',
        'JOURNAL_ALREADY_REVERSED'
      );
    }

    validateSourceReference(entry);

    if (entry.idempotency_key) {
      const duplicate =
        await this.repository.findByIdempotencyKey(
          entry.idempotency_key,
          session
        );
      if (
        duplicate &&
        String(duplicate._id) !== String(entry._id)
      ) {
        if (duplicate.status === 'posted') return duplicate;
        throw new AccountingDomainError(
          'Idempotency key sudah digunakan oleh journal draft lain.',
          'IDEMPOTENCY_KEY_CONFLICT'
        );
      }
    }

    await this.validatePosting(entry, session);
    const actorId = postedBy
      ? toAccountingObjectId(postedBy, 'postedBy')
      : undefined;
    const updated = await this.repository.markPosted(
      journalEntryId,
      postedBy,
      session
    );

    if (!updated) {
      const latest = await this.repository.findEntryById(
        journalEntryId,
        session
      );
      if (latest?.status === 'posted') return latest;

      throw new AccountingDomainError(
        'Journal entry gagal diposting karena status berubah.',
        'JOURNAL_POST_CONFLICT'
      );
    }

    await createAuditLog(
      this.context,
      {
        action: 'journal_entry.posted',
        entity_type: 'journal_entry',
        entity_id: toAccountingObjectId(
          String(updated._id),
          'journal_entry'
        ),
        ...(actorId ? { actor_id: actorId } : {}),
        metadata: {
          entry_number: updated.entry_number,
          source_type: updated.source_type,
          source_id: updated.source_id,
        },
      },
      session
    );

    return updated;
  }

  async postNew(
    input: CreateJournalEntryDTO | unknown,
    postedBy?: string,
    session?: ClientSession
  ) {
    const draft = await this.createDraft(input, session);
    return this.post(String(draft._id), postedBy, session);
  }

  async reverse(
    journalEntryId: string,
    input: ReversalInput,
    postedBy?: string,
    session?: ClientSession
  ) {
    const original = await this.repository.findEntryById(
      journalEntryId,
      session
    );
    if (!original) {
      throw new AccountingDomainError(
        'Journal entry yang akan direverse tidak ditemukan.',
        'JOURNAL_NOT_FOUND'
      );
    }

    const actorId = postedBy
      ? toAccountingObjectId(postedBy, 'postedBy')
      : undefined;

    const effectiveDate = parseAccountingDate(
      input.effective_date,
      'effective_date'
    );
    const period =
      input.period ?? getPeriodKeyFromDate(effectiveDate);
    const idempotencyKey =
      input.idempotency_key ??
      `reversal:${String(original._id)}:${period}`;

    const existingReversal =
      await this.repository.findByIdempotencyKey(
        idempotencyKey,
        session
      );
    if (existingReversal) {
      if (original.status === 'posted') {
        await this.repository.markReversed(
          journalEntryId,
          session
        );
      }
      return existingReversal;
    }

    if (original.status !== 'posted') {
      if (original.status === 'reversed') {
        throw new AccountingDomainError(
          'Journal entry sudah reversed tetapi reversal entry tidak ditemukan.',
          'REVERSAL_ENTRY_NOT_FOUND'
        );
      }

      throw new AccountingDomainError(
        'Hanya journal entry posted yang dapat direverse.',
        'JOURNAL_NOT_POSTED'
      );
    }

    await this.periodService.ensureOpen(
      period,
      effectiveDate
    );

    const reversalLines = original.lines.map((line) => ({
      account: String(line.account),
      debit: line.credit,
      credit: line.debit,
      description: line.description,
      dimensions: line.dimensions,
    }));

    const reversal = await this.postNew(
      {
        entry_number:
          input.reversal_entry_number ??
          `REV-${original.entry_number}-${period}`,
        transaction_date: effectiveDate.toISOString(),
        posting_date: effectiveDate.toISOString(),
        period,
        currency: original.currency,
        description:
          input.description ??
          `Reversal ${original.entry_number}: ${original.description}`,
        source_type: 'journal_reversal',
        source_id: String(original._id),
        source_event: 'reversal',
        idempotency_key: idempotencyKey,
        status: 'draft',
        lines: reversalLines,
      },
      postedBy,
      session
    );

    const markedOriginal =
      await this.repository.markReversed(
        journalEntryId,
        session
      );
    if (!markedOriginal) {
      const latest = await this.repository.findEntryById(
        journalEntryId,
        session
      );
      if (latest?.status !== 'reversed') {
        throw new AccountingDomainError(
          'Reversal berhasil dibuat tetapi journal original gagal ditandai reversed.',
          'REVERSAL_FINALIZATION_FAILED'
        );
      }
    }

    await createAuditLog(
      this.context,
      {
        action: 'journal_entry.reversed',
        entity_type: 'journal_entry',
        entity_id: toAccountingObjectId(
          String(original._id),
          'journal_entry'
        ),
        ...(actorId ? { actor_id: actorId } : {}),
        metadata: {
          reversal_entry_id: String(reversal._id),
        },
      },
      session
    );

    return reversal;
  }

  private async validatePosting(
    entry: {
      period: string;
      transaction_date: Date;
      posting_date: Date;
      lines: JournalLineForValidation[];
    },
    session?: ClientSession
  ) {
    const transactionDate = parseAccountingDate(
      entry.transaction_date,
      'transaction_date'
    );
    const postingDate = parseAccountingDate(
      entry.posting_date,
      'posting_date'
    );

    if (
      getPeriodKeyFromDate(transactionDate) !== entry.period
    ) {
      throw new AccountingDomainError(
        'transaction_date tidak sesuai dengan period journal.',
        'TRANSACTION_DATE_OUTSIDE_PERIOD'
      );
    }

    if (
      getPeriodKeyFromDate(postingDate) !== entry.period
    ) {
      throw new AccountingDomainError(
        'posting_date tidak sesuai dengan period journal.',
        'POSTING_DATE_OUTSIDE_PERIOD'
      );
    }

    await this.periodService.ensureOpen(
      entry.period,
      transactionDate
    );
    await this.periodService.ensureOpen(
      entry.period,
      postingDate
    );
    await this.validateAccounts(entry.lines, session);

    const totalDebit = entry.lines.reduce(
      (sum, line) => sum + line.debit,
      0
    );
    const totalCredit = entry.lines.reduce(
      (sum, line) => sum + line.credit,
      0
    );

    if (
      entry.lines.length < 2 ||
      totalDebit !== totalCredit
    ) {
      throw new AccountingDomainError(
        'Journal entry harus memiliki minimal dua line dan total debit harus sama dengan total credit.',
        'UNBALANCED_JOURNAL'
      );
    }
  }

  private async validateAccounts(
    lines: JournalLineDTO[] | JournalLineForValidation[],
    session?: ClientSession
  ) {
    const ids = lines.map((line) => String(line.account));
    const validIds = ids.filter((id) => {
      try {
        toAccountingObjectId(id, 'account');
        return true;
      } catch {
        return false;
      }
    });

    if (validIds.length !== ids.length) {
      throw new AccountingDomainError(
        'Semua account pada journal harus berupa ObjectId yang valid.',
        'INVALID_ACCOUNT_REFERENCE'
      );
    }

    const accounts = await this.accountRepository.findByIds(
      [...new Set(validIds)],
      session
    );
    const accountMap = new Map(
      accounts.map((account) => [
        String(account._id),
        account,
      ])
    );

    for (const id of ids) {
      const account = accountMap.get(id);
      if (!account) {
        throw new AccountingDomainError(
          `Account ${id} tidak ditemukan pada organization aktif.`,
          'ACCOUNT_NOT_FOUND'
        );
      }
      if (!account.is_active || !account.is_postable) {
        throw new AccountingDomainError(
          `Account ${account.code} tidak dapat digunakan untuk posting.`,
          'ACCOUNT_NOT_POSTABLE'
        );
      }
    }
  }
}
