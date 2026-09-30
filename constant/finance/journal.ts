export const FINANCE_JOURNAL_STATUS_VALUES = [
  'posted',
  'reversed',
] as const;

export type FinanceJournalStatus =
  (typeof FINANCE_JOURNAL_STATUS_VALUES)[number];
