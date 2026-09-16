import { z } from 'zod';
import { AccountingDimensionsSchema } from './accounting-dimensions';

const ManualJournalLineSchema = z
  .object({
    account: z.string().trim().min(1),
    debit: z.number().int().nonnegative().default(0),
    credit: z.number().int().nonnegative().default(0),
    description: z.string().trim().optional(),
  })
  .refine(
    (line) =>
      (line.debit > 0 && line.credit === 0) ||
      (line.credit > 0 && line.debit === 0),
    'Setiap baris harus memiliki debit atau credit, bukan keduanya.'
  );

export const PostManualJournalSchema = z
  .object({
    transaction_date: z.string().min(1),
    description: z.string().trim().min(1),
    store_id: z.string().trim().min(1).optional(),
    lines: z.array(ManualJournalLineSchema).min(2),
    idempotency_key: z.string().trim().min(1).optional(),
  })
  .superRefine((journal, context) => {
    const debit = journal.lines.reduce(
      (sum, line) => sum + line.debit,
      0
    );
    const credit = journal.lines.reduce(
      (sum, line) => sum + line.credit,
      0
    );

    if (debit !== credit) {
      context.addIssue({
        code: 'custom',
        path: ['lines'],
        message:
          'Total debit harus sama dengan total credit.',
      });
    }
  });

export const ManualJournalDimensionsSchema =
  AccountingDimensionsSchema.pick({ store: true });

export type PostManualJournalDTO = ReturnType<
  typeof PostManualJournalSchema.parse
>;
