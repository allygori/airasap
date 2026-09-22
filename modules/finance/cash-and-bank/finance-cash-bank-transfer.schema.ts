import { z } from 'zod';

const ObjectIdStringSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'ObjectId tidak valid');

export const FinanceCashBankTransferStatusSchema = z.enum([
  'pending',
  'posted',
  'reversed',
]);

export const FinanceCashBankTransferInputSchema = z
  .object({
    source_account_id: ObjectIdStringSchema,
    destination_account_id: ObjectIdStringSchema,
    amount: z.number().int().positive(),
    transaction_date: z.coerce.date(),
    reference: z.string().trim().max(120).optional(),
    description: z.string().trim().max(500).optional(),
    idempotency_key: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.source_account_id !==
      value.destination_account_id,
    {
      path: ['destination_account_id'],
      message: 'Akun sumber dan tujuan harus berbeda.',
    }
  );

export const FinanceCashBankTransferAccountSchema =
  z.object({
    id: ObjectIdStringSchema,
    code: z.string(),
    name: z.string(),
  });

export const FinanceCashBankTransferResponseSchema =
  z.object({
    transfer_id: ObjectIdStringSchema,
    source_account: FinanceCashBankTransferAccountSchema,
    destination_account:
      FinanceCashBankTransferAccountSchema,
    amount: z.number().int().positive(),
    transaction_date: z.string().datetime(),
    reference: z.string().nullable(),
    description: z.string(),
    status: FinanceCashBankTransferStatusSchema,
    journal_entry_id: ObjectIdStringSchema.nullable(),
    reversal_journal_entry_id:
      ObjectIdStringSchema.nullable(),
    idempotency_key: z.string(),
    replayed: z.boolean(),
  });

export const FinanceCashBankTransferSummarySchema =
  FinanceCashBankTransferResponseSchema.omit({
    replayed: true,
  });

export const FinanceCashBankTransferListQuerySchema = z
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
    status: FinanceCashBankTransferStatusSchema.optional(),
    search: z.string().trim().max(100).optional(),
  })
  .strict();

export const FinanceCashBankTransferListResponseSchema =
  z.object({
    transfers: z.array(
      FinanceCashBankTransferSummarySchema
    ),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      total_pages: z.number().int().nonnegative(),
    }),
  });

export const FinanceCashBankTransferDetailResponseSchema =
  z.object({
    transfer: FinanceCashBankTransferSummarySchema,
  });
