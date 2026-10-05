import { z } from 'zod';
import {
  FinanceCashBankAccountActiveInputSchema,
  FinanceCashBankAccountManagementInputSchema,
  FinanceCashBankManagedAccountSchema,
  FinanceCashBankManagedAccountsResponseSchema,
} from './finance-cash-bank-account-management.schema';

export type FinanceCashBankAccountManagementInputDTO =
  z.input<
    typeof FinanceCashBankAccountManagementInputSchema
  >;

export type FinanceCashBankAccountActiveInputDTO = z.input<
  typeof FinanceCashBankAccountActiveInputSchema
>;

export type FinanceCashBankManagedAccountDTO = z.infer<
  typeof FinanceCashBankManagedAccountSchema
>;

export type FinanceCashBankManagedAccountsResponseDTO =
  z.infer<
    typeof FinanceCashBankManagedAccountsResponseSchema
  >;
