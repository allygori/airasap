export const FINANCE_PERIOD_STATUS_VALUES = [
  'open',
  'closed',
] as const;

export type FinancePeriodStatus =
  (typeof FINANCE_PERIOD_STATUS_VALUES)[number];
