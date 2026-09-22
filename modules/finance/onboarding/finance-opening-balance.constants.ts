export const FINANCE_OPENING_BALANCE_MODE_VALUES = [
  'entered',
  'zero',
] as const;

export type FinanceOpeningBalanceMode =
  (typeof FINANCE_OPENING_BALANCE_MODE_VALUES)[number];

export const FINANCE_OPENING_BALANCE_STATUS_VALUES = [
  'draft',
  'posted',
  'skipped',
] as const;

export type FinanceOpeningBalanceStatus =
  (typeof FINANCE_OPENING_BALANCE_STATUS_VALUES)[number];

export const FINANCE_OPENING_BALANCE_MAX_AMOUNT = 1_000_000_000_000_000;
export const FINANCE_OPENING_BALANCE_JOURNAL_SOURCE =
  'opening_balance';
