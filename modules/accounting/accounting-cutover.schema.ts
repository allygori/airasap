import { z } from 'zod';
import { OpeningBalanceLineSchema } from './opening-balances/opening-balance.schema';

export const AccountingCutoverSchema = z
  .object({
    effective_date: z.string().min(1),
    description: z.string().trim().min(1),
    lines: z.array(OpeningBalanceLineSchema).min(2),
  })
  .superRefine((data, context) => {
    const debit = data.lines.reduce(
      (total, line) => total + line.debit,
      0
    );
    const credit = data.lines.reduce(
      (total, line) => total + line.credit,
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

export type AccountingCutoverDTO = ReturnType<
  typeof AccountingCutoverSchema.parse
>;
