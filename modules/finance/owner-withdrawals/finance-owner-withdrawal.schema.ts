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
    reversal_journal_entry_id:
      ObjectIdStringSchema.nullable(),
    idempotency_key: z.string().min(1),
    replayed: z.boolean(),
  });

export const FinanceOwnerWithdrawalSummarySchema =
  FinanceOwnerWithdrawalResponseSchema.omit({
    replayed: true,
  });

export const FinanceOwnerWithdrawalReversalInputSchema = z
  .object({
    effective_date: z.coerce.date(),
    reason: z.string().trim().min(3).max(300),
  })
  .strict();

const FinanceOwnerWithdrawalDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, 'Tanggal harus berupa tanggal kalender yang valid.');

export const FinanceOwnerWithdrawalListQuerySchema = z
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
    from_date: FinanceOwnerWithdrawalDateSchema,
    to_date: FinanceOwnerWithdrawalDateSchema,
    owner_account_id: ObjectIdStringSchema.optional(),
  })
  .strict()
  .superRefine((query, context) => {
    const from = new Date(
      `${query.from_date}T00:00:00.000Z`
    );
    const to = new Date(`${query.to_date}T00:00:00.000Z`);
    const rangeDays =
      (to.getTime() - from.getTime()) / 86_400_000;

    if (rangeDays < 0) {
      context.addIssue({
        code: 'custom',
        path: ['to_date'],
        message:
          'Tanggal akhir tidak boleh sebelum tanggal awal.',
      });
    } else if (rangeDays > 1_830) {
      context.addIssue({
        code: 'custom',
        path: ['to_date'],
        message: 'Rentang riwayat maksimal lima tahun.',
      });
    }
  });

export const FinanceOwnerWithdrawalMonthlyTotalSchema =
  z.object({
    period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    owner_account: FinanceOwnerWithdrawalAccountSchema,
    debit_total: z.number().int().nonnegative(),
    credit_total: z.number().int().nonnegative(),
    net_debit: z.number().int(),
  });

export const FinanceOwnerWithdrawalListResponseSchema =
  z.object({
    withdrawals: z.array(
      FinanceOwnerWithdrawalSummarySchema
    ),
    monthly_totals: z.array(
      FinanceOwnerWithdrawalMonthlyTotalSchema
    ),
    summary_range: z.object({
      from_date: FinanceOwnerWithdrawalDateSchema,
      to_date: FinanceOwnerWithdrawalDateSchema,
    }),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      total_pages: z.number().int().nonnegative(),
    }),
  });
