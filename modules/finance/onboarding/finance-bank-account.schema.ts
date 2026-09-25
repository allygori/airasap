import { z } from 'zod';

export const FinanceBankAccountCreateInputSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    institution: z.string().trim().max(120),
    account_last4: z
      .string()
      .trim()
      .regex(/^(?:\d{4})?$/),
    account_holder: z.string().trim().max(120),
  })
  .strict();

export const FinanceBankAccountCreateResponseSchema = z
  .object({
    account: z
      .object({
        id: z.string().regex(/^[a-f\d]{24}$/i),
        code: z.string().min(1),
        name: z.string().min(1),
        type: z.literal('asset'),
        subtype: z.literal('bank'),
        normal_balance: z.literal('debit'),
      })
      .strict(),
  })
  .strict();
