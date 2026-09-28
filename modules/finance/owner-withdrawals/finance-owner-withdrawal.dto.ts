import {
  FinanceOwnerWithdrawalInputSchema,
  FinanceOwnerWithdrawalListQuerySchema,
  FinanceOwnerWithdrawalListResponseSchema,
  FinanceOwnerWithdrawalMonthlyTotalSchema,
  FinanceOwnerWithdrawalReversalInputSchema,
  FinanceOwnerWithdrawalResponseSchema,
  FinanceOwnerWithdrawalStatusSchema,
  FinanceOwnerWithdrawalSummarySchema,
} from './finance-owner-withdrawal.schema';

export type FinanceOwnerWithdrawalInputDTO = ReturnType<
  typeof FinanceOwnerWithdrawalInputSchema.parse
>;

export type FinanceOwnerWithdrawalStatusDTO = ReturnType<
  typeof FinanceOwnerWithdrawalStatusSchema.parse
>;

export type FinanceOwnerWithdrawalReversalInputDTO =
  ReturnType<
    typeof FinanceOwnerWithdrawalReversalInputSchema.parse
  >;

export type FinanceOwnerWithdrawalResponseDTO = ReturnType<
  typeof FinanceOwnerWithdrawalResponseSchema.parse
>;

export type FinanceOwnerWithdrawalSummaryDTO = ReturnType<
  typeof FinanceOwnerWithdrawalSummarySchema.parse
>;

export type FinanceOwnerWithdrawalListQueryDTO = ReturnType<
  typeof FinanceOwnerWithdrawalListQuerySchema.parse
>;

export type FinanceOwnerWithdrawalListResponseDTO =
  ReturnType<
    typeof FinanceOwnerWithdrawalListResponseSchema.parse
  >;

export type FinanceOwnerWithdrawalMonthlyTotalDTO =
  ReturnType<
    typeof FinanceOwnerWithdrawalMonthlyTotalSchema.parse
  >;
