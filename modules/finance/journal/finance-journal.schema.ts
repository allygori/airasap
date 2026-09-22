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

export const FinanceJournalReversalSchema = z
  .object({
    effective_date: z.coerce.date().optional(),
    description: z
      .string()
      .trim()
      .min(1)
      .max(500)
      .optional(),
    idempotency_key: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .optional(),
  })
  .strict();

export const FinanceJournalListQuerySchema = z
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
    period: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
      .optional(),
    status: FinanceJournalStatusSchema.optional(),
    source_type: z.string().trim().max(80).optional(),
    search: z.string().trim().max(80).optional(),
  })
  .strict();

export const FinanceJournalLedgerQuerySchema = z
  .object({
    account_id: z.string().trim().min(1).max(80),
    page: z.coerce.number().int().min(1).max(50).default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(25),
    period: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
      .optional(),
  })
  .strict();

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
  reversal_of: z.string().nullable(),
  lines: z.array(FinanceJournalLineResponseSchema),
});

export const FinanceJournalEntrySummarySchema = z.object({
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
  status: FinanceJournalStatusSchema,
  total_debit: z.number().int().nonnegative(),
  total_credit: z.number().int().nonnegative(),
  line_count: z.number().int().nonnegative(),
  reversal_of: z.string().nullable(),
});

export const FinanceJournalLineDetailSchema =
  FinanceJournalLineResponseSchema.extend({
    account_code: z.string().nullable(),
    account_name: z.string().nullable(),
    normal_balance: z.enum(['debit', 'credit']).nullable(),
  });

export const FinanceJournalEntryDetailSchema =
  FinanceJournalEntryResponseSchema.extend({
    lines: z.array(FinanceJournalLineDetailSchema),
  });

export const FinanceJournalListResponseSchema = z.object({
  entries: z.array(FinanceJournalEntrySummarySchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
});

export const FinanceJournalDetailResponseSchema = z.object({
  journal_entry: FinanceJournalEntryDetailSchema,
});

export const FinanceLedgerRowSchema = z.object({
  id: z.string(),
  journal_entry_id: z.string(),
  entry_number: z.string(),
  transaction_date: z.string().datetime(),
  posting_date: z.string().datetime(),
  description: z.string(),
  source_type: z.string(),
  account_id: z.string(),
  account_code: z.string(),
  account_name: z.string(),
  normal_balance: z.enum(['debit', 'credit']),
  debit: z.number().int().nonnegative(),
  credit: z.number().int().nonnegative(),
  running_balance: z.number().int(),
});

export const FinanceLedgerResponseSchema = z.object({
  account: z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    normal_balance: z.enum(['debit', 'credit']),
  }),
  rows: z.array(FinanceLedgerRowSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
    truncated: z.boolean(),
  }),
});
