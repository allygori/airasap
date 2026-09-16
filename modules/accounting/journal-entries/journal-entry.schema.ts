import { z } from 'zod';
import {
  DEFAULT_CURRENCY,
  JOURNAL_ENTRY_STATUS_VALUES,
} from '../accounting.constant';
import { AccountingDimensionsSchema } from '../accounting-dimensions';

export const JournalEntryStatusSchema = z.enum(
  JOURNAL_ENTRY_STATUS_VALUES
);

export const JournalDimensionsSchema =
  AccountingDimensionsSchema;

export const JournalLineSchema = z
  .object({
    account: z.string().min(1),
    debit: z.number().int().nonnegative().default(0),
    credit: z.number().int().nonnegative().default(0),
    description: z.string().trim().optional(),
    dimensions: JournalDimensionsSchema.optional(),
  })
  .refine(
    (line) =>
      (line.debit > 0 && line.credit === 0) ||
      (line.credit > 0 && line.debit === 0),
    'Journal line harus memiliki debit atau credit, bukan keduanya.'
  );

export const JournalEntryBaseSchema = z.object({
  entry_number: z.string().trim().min(1),
  transaction_date: z.string().min(1),
  posting_date: z.string().min(1),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  currency: z.string().default(DEFAULT_CURRENCY),
  description: z.string().trim().min(1),
  source_type: z.string().trim().min(1).optional(),
  source_id: z.string().trim().min(1).optional(),
  source_event: z.string().trim().min(1).optional(),
  idempotency_key: z.string().trim().min(1).optional(),
  status: JournalEntryStatusSchema.default('draft'),
  posted_at: z.string().optional(),
  posted_by: z.string().optional(),
  reversal_of: z.string().optional(),
  lines: z.array(JournalLineSchema).min(2),
});

export const JournalEntrySchema =
  JournalEntryBaseSchema.superRefine((entry, context) => {
    if (entry.status === 'draft') return;

    const debit = entry.lines.reduce(
      (sum, line) => sum + line.debit,
      0
    );
    const credit = entry.lines.reduce(
      (sum, line) => sum + line.credit,
      0
    );

    if (debit !== credit) {
      context.addIssue({
        code: 'custom',
        path: ['lines'],
        message:
          'Total debit dan credit harus sama untuk journal posted/reversed.',
      });
    }
  });

export const CreateJournalEntrySchema =
  JournalEntryBaseSchema;
export const UpdateJournalEntrySchema =
  JournalEntryBaseSchema.partial();

export const JournalEntryResponseSchema =
  JournalEntryBaseSchema.extend({
    _id: z.string(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  });
