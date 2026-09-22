import type { FinancePeriodResponseDTO } from './finance-period.dto';
import { FinancePeriodResponseSchema } from './finance-period.schema';
import type { FinancePeriodPersistenceRecord } from './finance-period.repository';

export const mapFinancePeriod = (
  record: FinancePeriodPersistenceRecord
): FinancePeriodResponseDTO =>
  FinancePeriodResponseSchema.parse({
    id: String(record._id),
    period_key: record.period_key,
    start_date: record.start_date.toISOString(),
    end_date: record.end_date.toISOString(),
    status: record.status,
    closed_at: record.closed_at
      ? record.closed_at.toISOString()
      : null,
    closed_by: record.closed_by
      ? String(record.closed_by)
      : null,
  });
