import { z } from 'zod';
import { FINANCE_OWNER_WITHDRAWAL_STATUS_VALUES } from './finance-owner-withdrawal.constants';

const ObjectIdStringSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'ObjectId tidak valid');

export const FinanceOwnerWithdrawalStatusSchema = z.enum(
  FINANCE_OWNER_WITHDRAWAL_STATUS_VALUES
);

export const FinanceOwnerWithdrawalInputSchema = z
  .object({
    owner_account_id: ObjectIdStringSchema,
    payment_account_id: ObjectIdStringSchema,
    amount: z.coerce
      .number()
      .int()
      .positive()
      .max(1_000_000_000_000_000),
    transaction_date: z.coerce.date(),
    description: z.string().trim().max(500).optional(),
    reference: z.string().trim().max(120).optional(),
    idempotency_key: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .optional(),
  })
  .strict();

export const FinanceOwnerWithdrawalAccountSchema = z.object(
  {
    id: ObjectIdStringSchema,
    code: z.string().min(1),
    name: z.string().min(1),
  }
);

export const FinanceOwnerWithdrawalResponseSchema =
  z.object({
    withdrawal_id: ObjectIdStringSchema,
    owner_account: FinanceOwnerWithdrawalAccountSchema,
    payment_account: FinanceOwnerWithdrawalAccountSchema,
    amount: z.number().int().positive(),
    transaction_date: z.string().datetime(),
    description: z.string().min(1),
    reference: z.string().nullable(),
    status: FinanceOwnerWithdrawalStatusSchema,
    journal_entry_id: ObjectIdStringSchema.nullable(),
    idempotency_key: z.string().min(1),
    replayed: z.boolean(),
  });

export const FinanceOwnerWithdrawalSummarySchema =
  FinanceOwnerWithdrawalResponseSchema.omit({
    replayed: true,
  });

export const FinanceOwnerWithdrawalListQuerySchema = z
  .object({
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(25),
  })
  .strict();

export const FinanceOwnerWithdrawalListResponseSchema =
  z.object({
    withdrawals: z.array(
      FinanceOwnerWithdrawalSummarySchema
    ),
    meta: z.object({
      limit: z.number().int().positive(),
    }),
  });
