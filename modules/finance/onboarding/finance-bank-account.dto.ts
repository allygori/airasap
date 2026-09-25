import { z } from 'zod';
import {
  FinanceBankAccountCreateInputSchema,
  FinanceBankAccountCreateResponseSchema,
} from './finance-bank-account.schema';

export type FinanceBankAccountCreateInputDTO = z.input<
  typeof FinanceBankAccountCreateInputSchema
>;

export type FinanceBankAccountCreateResponseDTO = z.infer<
  typeof FinanceBankAccountCreateResponseSchema
>;
