export const FINANCE_CASH_BANK_SUBTYPE_VALUES = [
  'cash',
  'bank',
  'e_wallet',
  'marketplace_balance',
] as const;

export type FinanceCashBankSubtype =
  (typeof FINANCE_CASH_BANK_SUBTYPE_VALUES)[number];

export const FINANCE_CASH_BANK_SUBTYPE_LABELS: Record<
  FinanceCashBankSubtype,
  string
> = {
  cash: 'Kas',
  bank: 'Bank',
  e_wallet: 'E-wallet',
  marketplace_balance: 'Saldo marketplace',
};
