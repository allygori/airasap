import {
  FinanceSalesOrderSourceSchema,
  FinanceSalesProjectionIssueSchema,
  FinanceSalesProjectionLineSchema,
  FinanceSalesProjectionSchema,
  FinanceSalesPostingDecisionSchema,
  FinanceSalesPostingIntentSchema,
  FinanceSalesPostingJournalLineIntentSchema,
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
