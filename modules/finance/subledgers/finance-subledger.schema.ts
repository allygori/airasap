import { z } from 'zod';
import {
  FINANCE_SETTLEMENT_STATUS_VALUES,
  FINANCE_SUBLEDGER_OVERDUE_STATUS_VALUES,
  FINANCE_SUBLEDGER_SETTLEMENT_STATUS_VALUES,
  FINANCE_SUBLEDGER_TYPE_VALUES,
} from './finance-subledger.constants';

const ObjectIdStringSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'ObjectId tidak valid');

export const FinanceSubledgerTypeSchema = z.enum(
  FINANCE_SUBLEDGER_TYPE_VALUES
);

export const FinanceSubledgerSettlementStatusSchema =
  z.enum(FINANCE_SUBLEDGER_SETTLEMENT_STATUS_VALUES);

export const FinanceSubledgerOverdueStatusSchema = z.enum(
  FINANCE_SUBLEDGER_OVERDUE_STATUS_VALUES
);

export const FinanceSettlementStatusSchema = z.enum(
  FINANCE_SETTLEMENT_STATUS_VALUES
);

export const FinanceSubledgerListQuerySchema = z
  .object({
    balance_type: FinanceSubledgerTypeSchema,
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
    search: z.string().trim().max(100).optional(),
  })
  .strict();

export const FinanceSettlementInputSchema = z
  .object({
    balance_type: FinanceSubledgerTypeSchema,
    source_journal_entry_id: ObjectIdStringSchema,
    amount: z.coerce
      .number()
      .int()
      .positive()
      .max(1_000_000_000_000_000),
    settlement_date: z.coerce.date(),
    payment_account_id: ObjectIdStringSchema,
    reference: z.string().trim().max(120).optional(),
    description: z.string().trim().max(500).optional(),
    idempotency_key: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .optional(),
  })
  .strict();

export const FinanceSubledgerAccountSchema = z.object({
  id: ObjectIdStringSchema,
  code: z.string().min(1),
  name: z.string().min(1),
});

export const FinanceSubledgerBalanceSchema = z.object({
  source_journal_entry_id: ObjectIdStringSchema,
  balance_type: FinanceSubledgerTypeSchema,
  source_type: z.string().min(1),
  source_id: z.string().min(1),
  source_label: z.string().min(1),
  description: z.string().min(1),
  transaction_date: z.string().datetime(),
  due_date: z.string().datetime().nullable(),
  overdue_status: FinanceSubledgerOverdueStatusSchema,
  account: FinanceSubledgerAccountSchema,
  original_amount: z.number().int().positive(),
  settled_amount: z.number().int().nonnegative(),
  outstanding_amount: z.number().int().positive(),
  settlement_status: FinanceSubledgerSettlementStatusSchema,
  last_settlement_date: z.string().datetime().nullable(),
  currency: z.string().length(3),
});

export const FinanceSubledgerListResponseSchema = z.object({
  balance_type: FinanceSubledgerTypeSchema,
  balances: z.array(FinanceSubledgerBalanceSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
});

export const FinanceSettlementResponseSchema = z.object({
  settlement_id: ObjectIdStringSchema,
  balance_type: FinanceSubledgerTypeSchema,
  source_journal_entry_id: ObjectIdStringSchema,
  amount: z.number().int().positive(),
  settlement_date: z.string().datetime(),
  payment_account: FinanceSubledgerAccountSchema,
  reference: z.string().nullable(),
  description: z.string(),
  status: FinanceSettlementStatusSchema,
  journal_entry_id: ObjectIdStringSchema.nullable(),
  idempotency_key: z.string().min(1),
  replayed: z.boolean(),
});

export const FinanceSettlementSummarySchema =
  FinanceSettlementResponseSchema.omit({ replayed: true });

export const FinanceSettlementListResponseSchema = z.object(
  {
    settlements: z.array(FinanceSettlementSummarySchema),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      total_pages: z.number().int().nonnegative(),
    }),
  }
);
