export const FINANCE_SALES_PROJECTION_STATUS_VALUES = [
  'ready',
  'incomplete',
] as const;

export const FINANCE_SALES_PROJECTION_ISSUE_CODES = [
  'MISSING_STORE',
  'MISSING_ITEMS',
  'MISSING_SALES_AMOUNT',
  'MISSING_TRANSACTION_DATE',
] as const;

export type FinanceSalesProjectionStatus =
  (typeof FINANCE_SALES_PROJECTION_STATUS_VALUES)[number];

export type FinanceSalesProjectionIssueCode =
  (typeof FINANCE_SALES_PROJECTION_ISSUE_CODES)[number];
