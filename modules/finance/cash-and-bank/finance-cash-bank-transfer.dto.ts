import {
  FinanceCashBankTransferInputSchema,
  FinanceCashBankTransferDetailResponseSchema,
  FinanceCashBankTransferListQuerySchema,
  FinanceCashBankTransferListResponseSchema,
  FinanceCashBankTransferResponseSchema,
  FinanceCashBankTransferSummarySchema,
  FinanceCashBankTransferStatusSchema,
} from './finance-cash-bank-transfer.schema';

export type FinanceCashBankTransferInputDTO = ReturnType<
  typeof FinanceCashBankTransferInputSchema.parse
>;

export type FinanceCashBankTransferStatusDTO = ReturnType<
  typeof FinanceCashBankTransferStatusSchema.parse
>;

export type FinanceCashBankTransferListQueryDTO =
  ReturnType<
    typeof FinanceCashBankTransferListQuerySchema.parse
  >;

export type FinanceCashBankTransferResponseDTO = ReturnType<
  typeof FinanceCashBankTransferResponseSchema.parse
>;

export type FinanceCashBankTransferSummaryDTO = ReturnType<
  typeof FinanceCashBankTransferSummarySchema.parse
>;

export type FinanceCashBankTransferListResponseDTO =
  ReturnType<
    typeof FinanceCashBankTransferListResponseSchema.parse
  >;

export type FinanceCashBankTransferDetailResponseDTO =
  ReturnType<
    typeof FinanceCashBankTransferDetailResponseSchema.parse
  >;
