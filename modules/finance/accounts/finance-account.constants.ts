export const FINANCE_ACCOUNT_TYPE_VALUES = [
  'asset',
  'liability',
  'equity',
  'revenue',
  'cost_of_sales',
  'expense',
  'other_income',
  'other_expense',
] as const;

export const FINANCE_NORMAL_BALANCE_VALUES = [
  'debit',
  'credit',
] as const;

export const FINANCE_ACCOUNT_ROLE_VALUES = [
  'marketplace_receivable',
  'sales_revenue',
  'marketplace_balance',
  'marketplace_admin_fee',
  'payment_processing_fee',
  'campaign_and_affiliate',
  'shipping_and_transport',
] as const;

export type FinanceAccountType =
  (typeof FINANCE_ACCOUNT_TYPE_VALUES)[number];

export type FinanceNormalBalance =
  (typeof FINANCE_NORMAL_BALANCE_VALUES)[number];
