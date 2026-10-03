import {
  FinanceSalesOrderSourceSchema,
  FinanceSalesProjectionIssueSchema,
  FinanceSalesProjectionLineSchema,
  FinanceSalesProjectionSchema,
  FinanceSalesPostingDecisionSchema,
  FinanceSalesPostingIntentSchema,
  FinanceSalesPostingJournalLineIntentSchema,
  FinanceSalesPostingModeSchema,
  FinanceSalesTransactionStatusSchema,
  FinanceSalesTransactionDetailResponseSchema,
  FinanceSalesInventoryCogsStatusSchema,
  FinanceSalesTransactionListQuerySchema,
  FinanceSalesTransactionListResponseSchema,
  FinanceSalesTransactionSummarySchema,
  FinanceSalesWorkflowResultSchema,
  FinanceSalesCogsRetryResultSchema,
} from './finance-sales.schema';

export type FinanceSalesOrderSourceDTO = ReturnType<
  typeof FinanceSalesOrderSourceSchema.parse
>;

export type FinanceSalesProjectionIssueDTO = ReturnType<
  typeof FinanceSalesProjectionIssueSchema.parse
>;

export type FinanceSalesProjectionLineDTO = ReturnType<
  typeof FinanceSalesProjectionLineSchema.parse
>;

export type FinanceSalesProjectionDTO = ReturnType<
  typeof FinanceSalesProjectionSchema.parse
>;

export type FinanceSalesPostingJournalLineIntentDTO =
  ReturnType<
    typeof FinanceSalesPostingJournalLineIntentSchema.parse
  >;

export type FinanceSalesPostingIntentDTO = ReturnType<
  typeof FinanceSalesPostingIntentSchema.parse
>;

export type FinanceSalesPostingDecisionDTO = ReturnType<
  typeof FinanceSalesPostingDecisionSchema.parse
>;

export type FinanceSalesPostingModeDTO = ReturnType<
  typeof FinanceSalesPostingModeSchema.parse
>;

export type FinanceSalesTransactionStatusDTO = ReturnType<
  typeof FinanceSalesTransactionStatusSchema.parse
>;

export type FinanceSalesInventoryCogsStatusDTO = ReturnType<
  typeof FinanceSalesInventoryCogsStatusSchema.parse
>;

export type FinanceSalesWorkflowResultDTO = ReturnType<
  typeof FinanceSalesWorkflowResultSchema.parse
>;

export type FinanceSalesCogsRetryResultDTO = ReturnType<
  typeof FinanceSalesCogsRetryResultSchema.parse
>;

export type FinanceSalesTransactionListQueryDTO =
  ReturnType<
    typeof FinanceSalesTransactionListQuerySchema.parse
  >;

export type FinanceSalesTransactionSummaryDTO = ReturnType<
  typeof FinanceSalesTransactionSummarySchema.parse
>;

export type FinanceSalesTransactionListResponseDTO =
  ReturnType<
    typeof FinanceSalesTransactionListResponseSchema.parse
  >;

export type FinanceSalesTransactionDetailResponseDTO =
  ReturnType<
    typeof FinanceSalesTransactionDetailResponseSchema.parse
  >;
