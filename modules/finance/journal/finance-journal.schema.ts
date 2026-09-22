import { z } from 'zod';
import { FINANCE_JOURNAL_STATUS_VALUES } from './finance-journal.constants';

export const FinanceJournalStatusSchema = z.enum(
  FINANCE_JOURNAL_STATUS_VALUES
);

export const FinanceJournalDimensionsSchema = z
  .object({
    platform: z.string().trim().max(80).optional(),
    store_id: z.string().trim().max(80).optional(),
    inventory_location_id: z
      .string()
      .trim()
      .max(80)
      .optional(),
    product_id: z.string().trim().max(80).optional(),
  })
  .strict();

export const FinanceJournalLineSchema = z
  .object({
    account_id: z.string().trim().min(1).max(80),
    debit: z.number().int().nonnegative().default(0),
    credit: z.number().int().nonnegative().default(0),
    description: z.string().trim().max(500).optional(),
    dimensions: FinanceJournalDimensionsSchema.optional(),
  })
  .strict()
  .refine(
    (line) =>
      (line.debit > 0 && line.credit === 0) ||
      (line.credit > 0 && line.debit === 0),
    'Journal line harus memiliki debit atau credit, bukan keduanya.'
  );

export const FinanceOperationalPostingSchema = z
  .object({
    transaction_date: z.coerce.date(),
    posting_date: z.coerce.date().optional(),
    currency: z
      .string()
      .trim()
      .length(3)
      .transform((value) => value.toUpperCase())
      .default('IDR'),
    description: z.string().trim().min(1).max(500),
    source_type: z.string().trim().min(1).max(80),
    source_id: z.string().trim().min(1).max(160),
    source_event: z.string().trim().min(1).max(80),
    idempotency_key: z.string().trim().min(1).max(200),
    lines: z
      .array(FinanceJournalLineSchema)
      .min(2)
      .max(200),
  })
  .strict()
  .superRefine((entry, context) => {
    const totalDebit = entry.lines.reduce(
      (sum, line) => sum + line.debit,
      0
    );
    const totalCredit = entry.lines.reduce(
      (sum, line) => sum + line.credit,
      0
    );

    if (totalDebit !== totalCredit) {
      context.addIssue({
        code: 'custom',
        path: ['lines'],
        message:
          'Total debit dan credit harus sama untuk journal posted.',
      });
    }
  });

export const FinanceJournalLineResponseSchema = z.object({
  account_id: z.string(),
  debit: z.number().int().nonnegative(),
  credit: z.number().int().nonnegative(),
  description: z.string().nullable(),
  dimensions: FinanceJournalDimensionsSchema.nullable(),
});

export const FinanceJournalEntryResponseSchema = z.object({
  id: z.string(),
  entry_number: z.string(),
  transaction_date: z.string().datetime(),
  posting_date: z.string().datetime(),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  currency: z.string(),
  description: z.string(),
  source_type: z.string(),
  source_id: z.string(),
  source_event: z.string(),
  idempotency_key: z.string(),
  status: FinanceJournalStatusSchema,
  posted_at: z.string().datetime(),
  posted_by: z.string().nullable(),
  lines: z.array(FinanceJournalLineResponseSchema),
});
