import {
  FinanceSalesOrderSourceSchema,
  FinanceSalesProjectionIssueSchema,
  FinanceSalesProjectionLineSchema,
  FinanceSalesProjectionSchema,
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
