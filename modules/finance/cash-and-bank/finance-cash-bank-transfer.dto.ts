import {
  FinanceCashBankTransferInputSchema,
  FinanceCashBankTransferResponseSchema,
  FinanceCashBankTransferStatusSchema,
} from './finance-cash-bank-transfer.schema';

export type FinanceCashBankTransferInputDTO = ReturnType<
  typeof FinanceCashBankTransferInputSchema.parse
>;

export type FinanceCashBankTransferStatusDTO = ReturnType<
  typeof FinanceCashBankTransferStatusSchema.parse
>;

export type FinanceCashBankTransferResponseDTO = ReturnType<
  typeof FinanceCashBankTransferResponseSchema.parse
>;
