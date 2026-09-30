export const FINANCE_EXPENSE_STATUS_VALUES = [
  'draft',
  'posted',
] as const;

export const FINANCE_EXPENSE_PAYMENT_TIMING_VALUES = [
  'paid',
  'payable',
] as const;

export type FinanceExpenseStatus =
  (typeof FINANCE_EXPENSE_STATUS_VALUES)[number];

export type FinanceExpensePaymentTiming =
  (typeof FINANCE_EXPENSE_PAYMENT_TIMING_VALUES)[number];
