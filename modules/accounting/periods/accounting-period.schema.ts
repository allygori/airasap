import { z } from 'zod';
import { ACCOUNTING_PERIOD_STATUS_VALUES } from '../accounting.constant';

export const AccountingPeriodStatusSchema = z.enum(
  ACCOUNTING_PERIOD_STATUS_VALUES
);

export const AccountingPeriodBaseSchema = z.object({
  period_key: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  status: AccountingPeriodStatusSchema.default('open'),
  closed_at: z.string().optional(),
  closed_by: z.string().optional(),
});

export const CreateAccountingPeriodSchema =
  AccountingPeriodBaseSchema;
export const UpdateAccountingPeriodSchema =
  AccountingPeriodBaseSchema.partial();
export const AccountingPeriodResponseSchema =
  AccountingPeriodBaseSchema.extend({
    _id: z.string(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  });
