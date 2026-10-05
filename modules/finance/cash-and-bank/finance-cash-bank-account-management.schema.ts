import { z } from 'zod';
import { FinanceBankAccountCreateInputSchema } from '../onboarding/finance-bank-account.schema';
import { FinanceEWalletAccountCreateInputSchema } from '../onboarding/finance-e-wallet-account.schema';

export const FinanceCashBankAccountManagementInputSchema =
  z.discriminatedUnion('subtype', [
    FinanceBankAccountCreateInputSchema.extend({
      subtype: z.literal('bank'),
    }),
    FinanceEWalletAccountCreateInputSchema.extend({
      subtype: z.literal('e_wallet'),
    }),
  ]);

export const FinanceCashBankAccountActiveInputSchema = z
  .object({ is_active: z.boolean() })
  .strict();

export const FinanceCashBankManagedAccountSchema = z
  .object({
    id: z.string().regex(/^[a-f\d]{24}$/i),
    code: z.string().min(1),
    name: z.string().min(1),
    subtype: z.enum(['bank', 'e_wallet']),
    is_active: z.boolean(),
    account_metadata: z
      .object({
        institution: z.string().nullable(),
        provider: z.string().nullable(),
        account_last4: z
          .string()
          .regex(/^\d{4}$/)
          .nullable(),
      })
      .strict(),
  })
  .strict();

export const FinanceCashBankManagedAccountsResponseSchema =
  z
    .object({
      accounts: z.array(
        FinanceCashBankManagedAccountSchema
      ),
    })
    .strict();

export const FinanceCashBankManagedAccountResponseSchema = z
  .object({
    account: FinanceCashBankManagedAccountSchema,
  })
  .strict();
