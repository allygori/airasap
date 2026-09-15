import { z } from 'zod';

export const EXPENSE_STATUS_VALUES = [
  'draft',
  'posted',
  'voided',
] as const;

export const ExpenseStatusSchema = z.enum(
  EXPENSE_STATUS_VALUES
);

export const ExpenseDimensionsSchema = z.object({
  channel: z.string().min(1).optional(),
  store: z.string().min(1).optional(),
  warehouse: z.string().min(1).optional(),
});

export const ExpenseBaseSchema = z.object({
  expense_account: z.string().min(1),
  payment_account: z.string().min(1).optional(),
  amount: z.number().int().positive(),
  currency: z.string().default('IDR'),
  expense_date: z.string().min(1),
  description: z.string().trim().min(1),
  vendor_name: z.string().trim().optional(),
  source_type: z.string().trim().min(1).optional(),
  source_id: z.string().trim().min(1).optional(),
  idempotency_key: z.string().trim().min(1).optional(),
  dimensions: ExpenseDimensionsSchema.optional(),
  attachment: z.string().min(1).optional(),
  status: ExpenseStatusSchema.default('draft'),
});

export const CreateExpenseSchema = ExpenseBaseSchema;
export const UpdateExpenseSchema =
  ExpenseBaseSchema.partial();
export const ExpenseResponseSchema =
  ExpenseBaseSchema.extend({
    _id: z.string(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  });
