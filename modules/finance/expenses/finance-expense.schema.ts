import { z } from 'zod';
import {
  FINANCE_EXPENSE_PAYMENT_TIMING_VALUES,
  FINANCE_EXPENSE_STATUS_VALUES,
} from './finance-expense.constants';

const ObjectIdStringSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'ObjectId tidak valid');

export const FinanceExpenseStatusSchema = z.enum(
  FINANCE_EXPENSE_STATUS_VALUES
);

export const FinanceExpensePaymentTimingSchema = z.enum(
  FINANCE_EXPENSE_PAYMENT_TIMING_VALUES
);

export const FinanceExpenseInputSchema = z
  .object({
    category_account_id: ObjectIdStringSchema,
    amount: z.coerce
      .number()
      .int()
      .positive()
      .max(1_000_000_000_000_000),
    expense_date: z.coerce.date(),
    description: z.string().trim().min(1).max(500),
    vendor_name: z.string().trim().max(160).optional(),
    reference: z.string().trim().max(120).optional(),
    payment_timing: FinanceExpensePaymentTimingSchema,
    payment_account_id: ObjectIdStringSchema.optional(),
    notes: z.string().trim().max(500).optional(),
    attachment_reference: z
      .string()
      .trim()
      .max(200)
      .optional(),
    idempotency_key: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.payment_timing === 'paid' &&
      !value.payment_account_id
    ) {
      context.addIssue({
        code: 'custom',
        path: ['payment_account_id'],
        message:
          'Akun pembayaran wajib dipilih untuk expense yang sudah dibayar.',
      });
    }

    if (
      value.payment_timing === 'payable' &&
      value.payment_account_id
    ) {
      context.addIssue({
        code: 'custom',
        path: ['payment_account_id'],
        message:
          'Akun pembayaran tidak boleh diisi ketika expense menjadi utang.',
      });
    }
  });

export const FinanceExpenseAccountResponseSchema = z.object(
  {
    id: ObjectIdStringSchema,
    code: z.string().min(1),
    name: z.string().min(1),
  }
);

export const FinanceExpenseResponseSchema = z.object({
  expense_id: ObjectIdStringSchema,
  category_account: FinanceExpenseAccountResponseSchema,
  amount: z.number().int().positive(),
  expense_date: z.string().datetime(),
  description: z.string().min(1),
  vendor_name: z.string().nullable(),
  reference: z.string().nullable(),
  payment_timing: FinanceExpensePaymentTimingSchema,
  payment_account:
    FinanceExpenseAccountResponseSchema.nullable(),
  offset_account:
    FinanceExpenseAccountResponseSchema.nullable(),
  notes: z.string().nullable(),
  attachment_reference: z.string().nullable(),
  status: FinanceExpenseStatusSchema,
  journal_entry_id: ObjectIdStringSchema.nullable(),
  idempotency_key: z.string().min(1),
  replayed: z.boolean(),
});

export const FinanceExpenseSummarySchema =
  FinanceExpenseResponseSchema.omit({ replayed: true });

export const FinanceExpenseListQuerySchema = z
  .object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .max(1000)
      .default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(25),
    status: FinanceExpenseStatusSchema.optional(),
    search: z.string().trim().max(100).optional(),
  })
  .strict();

export const FinanceExpenseListResponseSchema = z.object({
  expenses: z.array(FinanceExpenseSummarySchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
});

export const FinanceExpenseDetailResponseSchema = z.object({
  expense: FinanceExpenseSummarySchema,
});
