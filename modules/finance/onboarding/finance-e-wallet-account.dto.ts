import { z } from 'zod';
import {
  FinanceEWalletAccountCreateInputSchema,
  FinanceEWalletAccountCreateResponseSchema,
} from './finance-e-wallet-account.schema';

export type FinanceEWalletAccountCreateInputDTO = z.input<
  typeof FinanceEWalletAccountCreateInputSchema
>;

export type FinanceEWalletAccountCreateResponseDTO =
  z.infer<typeof FinanceEWalletAccountCreateResponseSchema>;
