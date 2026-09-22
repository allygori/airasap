export const FINANCE_SUBLEDGER_TYPE_VALUES = [
  'receivable',
  'payable',
] as const;

export const FINANCE_SUBLEDGER_SETTLEMENT_STATUS_VALUES = [
  'open',
  'partial',
] as const;

export const FINANCE_SUBLEDGER_OVERDUE_STATUS_VALUES = [
  'not_configured',
  'not_overdue',
  'overdue',
] as const;

export const FINANCE_SETTLEMENT_STATUS_VALUES = [
  'pending',
  'posted',
] as const;

export type FinanceSubledgerType =
  (typeof FINANCE_SUBLEDGER_TYPE_VALUES)[number];

export type FinanceSubledgerSettlementStatus =
  (typeof FINANCE_SUBLEDGER_SETTLEMENT_STATUS_VALUES)[number];

export type FinanceSubledgerOverdueStatus =
  (typeof FINANCE_SUBLEDGER_OVERDUE_STATUS_VALUES)[number];

export type FinanceSettlementStatus =
  (typeof FINANCE_SETTLEMENT_STATUS_VALUES)[number];
