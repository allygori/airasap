import { z } from 'zod';

export const FinanceEWalletAccountCreateInputSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    provider: z.string().trim().min(1).max(120),
  })
  .strict();

export const FinanceEWalletAccountCreateResponseSchema = z
  .object({
    account: z
      .object({
        id: z.string().regex(/^[a-f\d]{24}$/i),
        code: z.string().min(1),
        name: z.string().min(1),
        type: z.literal('asset'),
        subtype: z.literal('e_wallet'),
        normal_balance: z.literal('debit'),
      })
      .strict(),
  })
  .strict();
