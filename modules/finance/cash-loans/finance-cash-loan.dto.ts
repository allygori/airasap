import {
  FinanceCashLoanBalanceSchema,
  FinanceCashLoanInputSchema,
  FinanceCashLoanListQuerySchema,
  FinanceCashLoanListResponseSchema,
  FinanceCashLoanReversalInputSchema,
  FinanceCashLoanResponseSchema,
  FinanceCashLoanStatusSchema,
  FinanceCashLoanSummarySchema,
} from './finance-cash-loan.schema';

export type FinanceCashLoanInputDTO = ReturnType<
  typeof FinanceCashLoanInputSchema.parse
>;
export type FinanceCashLoanReversalInputDTO = ReturnType<
  typeof FinanceCashLoanReversalInputSchema.parse
>;
export type FinanceCashLoanStatusDTO = ReturnType<
  typeof FinanceCashLoanStatusSchema.parse
>;
export type FinanceCashLoanResponseDTO = ReturnType<
  typeof FinanceCashLoanResponseSchema.parse
>;
export type FinanceCashLoanSummaryDTO = ReturnType<
  typeof FinanceCashLoanSummarySchema.parse
>;
export type FinanceCashLoanListQueryDTO = ReturnType<
  typeof FinanceCashLoanListQuerySchema.parse
>;
export type FinanceCashLoanListResponseDTO = ReturnType<
  typeof FinanceCashLoanListResponseSchema.parse
>;
export type FinanceCashLoanBalanceDTO = ReturnType<
  typeof FinanceCashLoanBalanceSchema.parse
>;
