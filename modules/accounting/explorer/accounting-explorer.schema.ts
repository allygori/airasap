import { z } from 'zod';

const PeriodSchema = z
  .string()
  .regex(
    /^\d{4}-(0[1-9]|1[0-2])$/,
    'Period harus berformat YYYY-MM.'
  );

const StoreIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'store_id tidak valid.');

export const AccountingExplorerQuerySchema = z.object({
  period: PeriodSchema.optional(),
  account_id: z.string().trim().min(1).optional(),
  store_id: StoreIdSchema.optional(),
  platform: z.string().trim().min(1).optional(),
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
