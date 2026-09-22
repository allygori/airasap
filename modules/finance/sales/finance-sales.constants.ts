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

export const FINANCE_SALES_POSTING_DECISION_VALUES = [
  'eligible',
  'not_eligible',
  'blocked',
] as const;

export const FINANCE_SALES_POSTING_REASON_CODES = [
  'ORDER_STATUS_NOT_ELIGIBLE',
  'PROJECTION_INCOMPLETE',
  'SALES_AMOUNT_INVALID',
] as const;

export const FINANCE_SALES_POSTING_EVENT_VALUES = [
  'completed_order',
] as const;

export const FINANCE_SALES_ACCOUNT_ROLE_VALUES = [
  'marketplace_receivable',
  'sales_revenue',
] as const;

export type FinanceSalesProjectionStatus =
  (typeof FINANCE_SALES_PROJECTION_STATUS_VALUES)[number];

export type FinanceSalesProjectionIssueCode =
  (typeof FINANCE_SALES_PROJECTION_ISSUE_CODES)[number];

export type FinanceSalesPostingDecision =
  (typeof FINANCE_SALES_POSTING_DECISION_VALUES)[number];
