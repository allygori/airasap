import { z } from 'zod';

const ObjectIdStringSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'ObjectId tidak valid');

export const FinanceMarketplaceWithdrawalInputSchema = z
  .object({
    destination_account_id: ObjectIdStringSchema,
    amount: z
      .number()
      .int()
      .positive()
      .max(1_000_000_000_000_000),
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
  .strict();

export type FinanceMarketplaceWithdrawalInputDTO =
  ReturnType<
    typeof FinanceMarketplaceWithdrawalInputSchema.parse
  >;
