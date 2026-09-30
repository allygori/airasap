export const FINANCE_CASH_LOAN_EVENT_TYPE_VALUES = [
  'received',
  'repayment',
] as const;

export const FINANCE_CASH_LOAN_LENDER_TYPE_VALUES = [
  'owner',
  'bank',
  'digital_lender',
  'other',
] as const;

export const FINANCE_CASH_LOAN_STATUS_VALUES = [
  'draft',
  'posted',
  'reversed',
] as const;

export type FinanceCashLoanEventType =
  (typeof FINANCE_CASH_LOAN_EVENT_TYPE_VALUES)[number];
export type FinanceCashLoanLenderType =
  (typeof FINANCE_CASH_LOAN_LENDER_TYPE_VALUES)[number];
export type FinanceCashLoanStatus =
  (typeof FINANCE_CASH_LOAN_STATUS_VALUES)[number];
