import { z } from 'zod';

const PeriodSchema = z
  .string()
  .regex(
    /^\d{4}-(0[1-9]|1[0-2])$/,
    'Period harus berformat YYYY-MM.'
  );

export const AccountingExplorerQuerySchema = z.object({
  period: PeriodSchema.optional(),
  account_id: z.string().trim().min(1).optional(),
  status: z
    .enum(['draft', 'posted', 'reversed'])
    .optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(50),
});

export type AccountingExplorerQuery = ReturnType<
  typeof AccountingExplorerQuerySchema.parse
>;
