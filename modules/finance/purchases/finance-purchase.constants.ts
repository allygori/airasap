export const FINANCE_PURCHASE_STATUS_VALUES = [
  'draft',
  'posted',
] as const;

export const FINANCE_PURCHASE_PAYMENT_TIMING_VALUES = [
  'paid',
  'payable',
] as const;

export type FinancePurchaseStatus =
  (typeof FINANCE_PURCHASE_STATUS_VALUES)[number];

export type FinancePurchasePaymentTiming =
  (typeof FINANCE_PURCHASE_PAYMENT_TIMING_VALUES)[number];
