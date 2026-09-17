import { randomUUID } from 'node:crypto';
import { JournalEntryService } from './journal-entries/journal-entry.service';
import { AccountingDomainError } from './accounting.error';
import {
  getPeriodKeyFromDate,
  parseAccountingDate,
  toAccountingObjectId,
  type AccountingTenantContext,
} from './accounting.types';
import { resolveAccountingScope } from './accounting-scope';
import { PostManualJournalSchema } from './manual-journal.schema';
import { assertAccountingModuleActive } from './accounting-module.guard';

export class ManualJournalService {
  private readonly journalEntryService: JournalEntryService;
  private readonly context: AccountingTenantContext;

  constructor(context: AccountingTenantContext) {
    this.context = context;
    this.journalEntryService = new JournalEntryService(
      context
    );
  }

  async post(input: unknown) {
    const accountingState =
      await assertAccountingModuleActive(this.context);
    const data = PostManualJournalSchema.parse(input);
    const transactionDate = parseAccountingDate(
      data.transaction_date,
      'transaction_date'
    );
    const scope = await resolveAccountingScope(
      toAccountingObjectId(
        this.context.organizationId,
        'organizationId'
      ),
      data.store_id ? { store_id: data.store_id } : {}
    );
    const period = getPeriodKeyFromDate(
      transactionDate,
      accountingState.calendar_timezone
    );
    const manualSourceId = `manual:${randomUUID()}`;
    const scopeDimensions = scope.store
      ? { store: String(scope.store) }
      : undefined;

    if (
      data.lines.some(
        (line) => line.debit === 0 && line.credit === 0
      )
    ) {
      throw new AccountingDomainError(
        'Setiap baris journal harus memiliki nilai debit atau credit.',
        'EMPTY_JOURNAL_LINE'
      );
    }

    return this.journalEntryService.postNew(
      {
        entry_number: `MAN-${period}-${randomUUID()
          .slice(0, 8)
          .toUpperCase()}`,
        transaction_date: transactionDate.toISOString(),
        posting_date: transactionDate.toISOString(),
        period,
        currency: 'IDR',
        description: data.description,
        source_type: 'manual',
        source_id: manualSourceId,
        source_event: 'manual_entry',
        idempotency_key:
          data.idempotency_key ?? `manual:${randomUUID()}`,
        status: 'draft',
        lines: data.lines.map((line) => ({
          account: line.account,
          debit: line.debit,
          credit: line.credit,
          description: line.description,
          ...(scopeDimensions
            ? { dimensions: scopeDimensions }
            : {}),
        })),
      },
      this.context.userId
    );
  }
}
