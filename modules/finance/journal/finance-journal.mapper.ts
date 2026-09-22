import { FinanceJournalEntryResponseSchema } from './finance-journal.schema';
import type { FinanceJournalEntryDTO } from './finance-journal.dto';
import type { FinanceJournalPersistenceRecord } from './finance-journal.repository';

export const mapFinanceJournalEntry = (
  record: FinanceJournalPersistenceRecord
): FinanceJournalEntryDTO =>
  FinanceJournalEntryResponseSchema.parse({
    id: String(record._id),
    entry_number: record.entry_number,
    transaction_date: record.transaction_date.toISOString(),
    posting_date: record.posting_date.toISOString(),
    period: record.period,
    currency: record.currency,
    description: record.description,
    source_type: record.source_type,
    source_id: record.source_id,
    source_event: record.source_event,
    idempotency_key: record.idempotency_key,
    status: record.status,
    posted_at: record.posted_at.toISOString(),
    posted_by: record.posted_by
      ? String(record.posted_by)
      : null,
    reversal_of: record.reversal_of
      ? String(record.reversal_of)
      : null,
    lines: record.lines.map((line) => ({
      account_id: String(line.account_id),
      debit: line.debit,
      credit: line.credit,
      description: line.description ?? null,
      dimensions: line.dimensions ?? null,
    })),
  });
