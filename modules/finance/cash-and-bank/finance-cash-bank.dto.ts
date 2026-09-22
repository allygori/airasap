import {
  FinanceCashBankAccountSchema,
  FinanceCashBankQuerySchema,
  FinanceCashBankResponseSchema,
  FinanceCashBankSubtypeSchema,
} from './finance-cash-bank.schema';

export type FinanceCashBankSubtypeDTO = ReturnType<
  typeof FinanceCashBankSubtypeSchema.parse
>;

export type FinanceCashBankQueryDTO = ReturnType<
  typeof FinanceCashBankQuerySchema.parse
>;

export type FinanceCashBankAccountDTO = ReturnType<
  typeof FinanceCashBankAccountSchema.parse
>;

export type FinanceCashBankResponseDTO = ReturnType<
  typeof FinanceCashBankResponseSchema.parse
>;
