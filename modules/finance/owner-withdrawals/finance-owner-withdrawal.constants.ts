export const FINANCE_OWNER_WITHDRAWAL_STATUS_VALUES = [
  'draft',
  'posted',
  'reversed',
] as const;

export type FinanceOwnerWithdrawalStatus =
  (typeof FINANCE_OWNER_WITHDRAWAL_STATUS_VALUES)[number];
