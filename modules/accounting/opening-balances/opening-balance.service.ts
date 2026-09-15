import type { ClientSession } from 'mongoose';
import { CreateOpeningBalanceSchema } from './opening-balance.schema';
import { OpeningBalanceRepository } from './opening-balance.repository';
import { JournalEntryService } from '../journal-entries/journal-entry.service';
import { AccountingDomainError } from '../accounting.error';
import {
  assertAccountingTenant,
  parseAccountingDate,
  toAccountingObjectId,
  type AccountingTenantContext,
} from '../accounting.types';
import { createAuditLog } from '../audit/audit-log.model';

export class OpeningBalanceService {
  private readonly repository: OpeningBalanceRepository;
  private readonly journalService: JournalEntryService;
  private readonly context: AccountingTenantContext;

  constructor(context: AccountingTenantContext) {
    assertAccountingTenant(context);
    this.context = context;
    this.repository = new OpeningBalanceRepository(context);
    this.journalService = new JournalEntryService(context);
  }

  async createDraft(
    input: unknown,
    session?: ClientSession
  ) {
    const data = CreateOpeningBalanceSchema.parse(input);
    if (data.status !== 'draft') {
      throw new AccountingDomainError(
        'Opening balance baru harus dibuat sebagai draft.',
        'OPENING_BALANCE_MUST_START_AS_DRAFT'
      );
    }

    return this.repository.createOpeningBalance(
      {
        opening_balance_number: data.opening_balance_number,
        effective_date: parseAccountingDate(
          data.effective_date,
          'effective_date'
        ),
        period: data.period,
        currency: data.currency,
        description: data.description,
        status: 'draft',
        journal_entry: data.journal_entry,
        lines: data.lines,
      },
      session
    );
  }

  async post(
    openingBalanceId: string,
    postedBy?: string,
    session?: ClientSession
  ) {
    const openingBalance =
      await this.repository.findOpeningBalanceById(
        openingBalanceId,
        session
      );
    if (!openingBalance) {
      throw new AccountingDomainError(
        'Opening balance tidak ditemukan.',
        'OPENING_BALANCE_NOT_FOUND'
      );
    }

    if (
      openingBalance.status === 'posted' &&
      openingBalance.journal_entry
    ) {
      return openingBalance;
    }

    if (openingBalance.status === 'posted') {
      throw new AccountingDomainError(
        'Opening balance sudah posted tetapi journal_entry tidak tersedia.',
        'OPENING_BALANCE_JOURNAL_REFERENCE_MISSING'
      );
    }

    if (openingBalance.status === 'reversed') {
      throw new AccountingDomainError(
        'Opening balance yang sudah reversed tidak dapat diposting ulang.',
        'OPENING_BALANCE_ALREADY_REVERSED'
      );
    }

    const actorId = postedBy
      ? toAccountingObjectId(postedBy, 'postedBy')
      : undefined;

    const journalEntry = await this.journalService.postNew(
      {
        entry_number: `OB-${openingBalance.opening_balance_number}`,
        transaction_date: new Date(
          openingBalance.effective_date
        ).toISOString(),
        posting_date: new Date(
          openingBalance.effective_date
        ).toISOString(),
        period: openingBalance.period,
        currency: openingBalance.currency,
        description: openingBalance.description,
        source_type: 'opening_balance',
        source_id: String(openingBalance._id),
        source_event: 'initialization',
        idempotency_key: `opening-balance:${String(
          openingBalance._id
        )}`,
        status: 'draft',
        lines: openingBalance.lines.map((line) => ({
          account: String(line.account),
          debit: line.debit,
          credit: line.credit,
        })),
      },
      postedBy,
      session
    );

    const posted = await this.repository.markPosted(
      openingBalanceId,
      String(journalEntry._id),
      session
    );
    if (!posted) {
      const latest =
        await this.repository.findOpeningBalanceById(
          openingBalanceId,
          session
        );
      if (latest?.status === 'posted') return latest;

      throw new AccountingDomainError(
        'Journal opening balance berhasil diposting tetapi dokumen opening balance gagal diperbarui.',
        'OPENING_BALANCE_FINALIZATION_FAILED'
      );
    }

    await createAuditLog(
      this.context,
      {
        action: 'opening_balance.posted',
        entity_type: 'opening_balance',
        entity_id: toAccountingObjectId(
          String(posted._id),
          'opening_balance'
        ),
        ...(actorId ? { actor_id: actorId } : {}),
        metadata: {
          journal_entry_id: String(journalEntry._id),
        },
      },
      session
    );

    return posted;
  }

  async initialize(
    input: unknown,
    postedBy?: string,
    session?: ClientSession
  ) {
    const draft = await this.createDraft(input, session);
    return this.post(String(draft._id), postedBy, session);
  }
}
