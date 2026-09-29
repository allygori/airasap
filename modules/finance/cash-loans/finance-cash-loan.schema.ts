import { z } from 'zod';
import {
  FINANCE_CASH_LOAN_EVENT_TYPE_VALUES,
  FINANCE_CASH_LOAN_LENDER_TYPE_VALUES,
  FINANCE_CASH_LOAN_STATUS_VALUES,
} from './finance-cash-loan.constants';

const ObjectIdStringSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'ObjectId tidak valid');

export const FinanceCashLoanEventTypeSchema = z.enum(
  FINANCE_CASH_LOAN_EVENT_TYPE_VALUES
);
export const FinanceCashLoanLenderTypeSchema = z.enum(
  FINANCE_CASH_LOAN_LENDER_TYPE_VALUES
);
export const FinanceCashLoanStatusSchema = z.enum(
  FINANCE_CASH_LOAN_STATUS_VALUES
);

export const FinanceCashLoanInputSchema = z
  .object({
    event_type: FinanceCashLoanEventTypeSchema,
    lender_type: FinanceCashLoanLenderTypeSchema.optional(),
    lender_name: z.string().trim().max(150).optional(),
    owner_account_id: ObjectIdStringSchema.optional(),
    lender_key: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .optional(),
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
  .strict()
  .superRefine((input, context) => {
    if (input.event_type === 'received') {
      if (!input.lender_type) {
        context.addIssue({
          code: 'custom',
          path: ['lender_type'],
          message: 'Pilih sumber pinjaman.',
        });
        return;
      }

      if (input.lender_type === 'owner') {
        if (input.lender_name !== undefined) {
          context.addIssue({
            code: 'custom',
            path: ['lender_name'],
            message:
              'Nama pemberi pinjaman diambil dari akun pemilik.',
          });
        }
        if (!input.owner_account_id) {
          context.addIssue({
            code: 'custom',
            path: ['owner_account_id'],
            message: 'Pilih pemilik pemberi pinjaman.',
          });
        }
      } else if (!input.lender_name?.trim()) {
        context.addIssue({
          code: 'custom',
          path: ['lender_name'],
          message: 'Masukkan nama pemberi pinjaman.',
        });
      } else if (input.owner_account_id !== undefined) {
        context.addIssue({
          code: 'custom',
          path: ['owner_account_id'],
          message:
            'Akun pemilik hanya digunakan untuk pinjaman dari pemilik.',
        });
      }
    } else {
      if (!input.lender_key) {
        context.addIssue({
          code: 'custom',
          path: ['lender_key'],
          message: 'Pilih pinjaman yang akan dibayar.',
        });
      }
      if (
        input.lender_type !== undefined ||
        input.lender_name !== undefined ||
        input.owner_account_id !== undefined
      ) {
        context.addIssue({
          code: 'custom',
          path: ['lender_key'],
          message:
            'Pembayaran memilih pemberi pinjaman dari saldo yang tersedia.',
        });
      }
    }
  });

export const FinanceCashLoanReversalInputSchema = z
  .object({
    effective_date: z.coerce.date(),
    reason: z.string().trim().min(3).max(300),
  })
  .strict();

export const FinanceCashLoanAccountSchema = z.object({
  id: ObjectIdStringSchema,
  code: z.string().min(1),
  name: z.string().min(1),
});

export const FinanceCashLoanLenderSchema = z.object({
  key: z.string().min(1).max(200),
  type: FinanceCashLoanLenderTypeSchema,
  name: z.string().min(1),
  owner_account: FinanceCashLoanAccountSchema.nullable(),
});

export const FinanceCashLoanLiabilityAccountSchema =
  z.object({
    code: z.string().min(1),
    name: z.string().min(1),
  });

export const FinanceCashLoanResponseSchema = z.object({
  loan_id: ObjectIdStringSchema,
  event_type: FinanceCashLoanEventTypeSchema,
  lender: FinanceCashLoanLenderSchema,
  liability_account: FinanceCashLoanLiabilityAccountSchema,
  payment_account: FinanceCashLoanAccountSchema,
  amount: z.number().int().positive(),
  transaction_date: z.string().datetime(),
  description: z.string().min(1),
  reference: z.string().nullable(),
  status: FinanceCashLoanStatusSchema,
  journal_entry_id: ObjectIdStringSchema.nullable(),
  reversal_journal_entry_id:
    ObjectIdStringSchema.nullable(),
  idempotency_key: z.string().min(1),
  replayed: z.boolean(),
});

export const FinanceCashLoanSummarySchema =
  FinanceCashLoanResponseSchema.omit({ replayed: true });

export const FinanceCashLoanListQuerySchema = z
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
    lender_key: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .optional(),
  })
  .strict();

export const FinanceCashLoanBalanceSchema = z.object({
  lender: FinanceCashLoanLenderSchema,
  received_total: z.number().int().nonnegative(),
  repayment_total: z.number().int().nonnegative(),
  outstanding_amount: z.number().int().nonnegative(),
});

export const FinanceCashLoanListResponseSchema = z.object({
  loans: z.array(FinanceCashLoanSummarySchema),
  balances: z.array(FinanceCashLoanBalanceSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
});
