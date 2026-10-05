import { z } from 'zod';
import { FINANCE_CASH_BANK_SUBTYPE_VALUES } from './finance-cash-bank.constants';

export const FinanceCashBankSubtypeSchema = z.enum(
  FINANCE_CASH_BANK_SUBTYPE_VALUES
);

export const FinanceCashBankQuerySchema = z
  .object({
    search: z.string().trim().max(80).optional(),
    status: z
      .enum(['all', 'active', 'inactive'])
      .default('all'),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(100),
  })
  .strict();

export const FinanceCashBankAccountMetadataSchema =
  z.object({
    institution: z.string().nullable(),
    account_last4: z
      .string()
      .regex(/^\d{4}$/)
      .nullable(),
    account_holder: z.string().nullable(),
    provider: z.string().nullable(),
  });

export const FinanceCashBankAccountSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  is_active: z.boolean(),
  subtype: FinanceCashBankSubtypeSchema,
  normal_balance: z.enum(['debit', 'credit']),
  account_metadata: FinanceCashBankAccountMetadataSchema,
  opening_balance: z.number().int(),
  debit_total: z.number().int().nonnegative(),
  credit_total: z.number().int().nonnegative(),
  current_balance: z.number().int(),
  journal_line_count: z.number().int().nonnegative(),
  last_transaction_date: z.string().datetime().nullable(),
});

export const FinanceCashBankResponseSchema = z.object({
  accounts: z.array(FinanceCashBankAccountSchema),
  meta: z.object({
    total_accounts: z.number().int().nonnegative(),
    accounts_with_activity: z.number().int().nonnegative(),
    total_balance: z.number().int(),
    limit: z.number().int().positive(),
  }),
});
