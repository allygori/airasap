import { z } from 'zod';
import { FINANCE_PERIOD_STATUS_VALUES } from './finance-period.constants';

export const FinancePeriodStatusSchema = z.enum(
  FINANCE_PERIOD_STATUS_VALUES
);

export const FinancePeriodKeySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/);

export const FinanceClosePeriodSchema = z
  .object({
    period_key: FinancePeriodKeySchema,
  })
  .strict();

export const FinancePeriodResponseSchema = z.object({
  id: z.string(),
  period_key: FinancePeriodKeySchema,
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  status: FinancePeriodStatusSchema,
  closed_at: z.string().datetime().nullable(),
  closed_by: z.string().nullable(),
});
