export const DEFAULT_CURRENCY = 'IDR' as const;

export const ACCOUNT_TYPE_VALUES = [
  'asset',
  'liability',
  'equity',
  'revenue',
  'cost_of_sales',
  'expense',
  'other_income',
  'other_expense',
] as const;

export const NORMAL_BALANCE_VALUES = [
  'debit',
  'credit',
] as const;

export const JOURNAL_ENTRY_STATUS_VALUES = [
  'draft',
  'posted',
  'reversed',
] as const;

export const ACCOUNTING_PERIOD_STATUS_VALUES = [
  'open',
  'closed',
] as const;

export const OPENING_BALANCE_STATUS_VALUES = [
  'draft',
  'posted',
  'reversed',
] as const;

export type AccountType =
  (typeof ACCOUNT_TYPE_VALUES)[number];
export type NormalBalance =
  (typeof NORMAL_BALANCE_VALUES)[number];
export type JournalEntryStatus =
  (typeof JOURNAL_ENTRY_STATUS_VALUES)[number];
