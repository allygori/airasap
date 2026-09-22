export const FINANCE_INVENTORY_ITEM_TYPE_VALUES = [
  'merchandise',
  'packaging',
  'supplies',
  'fixed_asset',
] as const;

export const FINANCE_INVENTORY_MOVEMENT_TYPE_VALUES = [
  'purchase',
  'sale',
  'return',
  'damage',
  'loss',
  'adjustment',
  'transfer_in',
  'transfer_out',
  'consumption',
  'opening_balance',
] as const;

export const FINANCE_INVENTORY_MOVEMENT_STATUS_VALUES = [
  'draft',
  'posted',
  'voided',
] as const;

export const FINANCE_INVENTORY_STOCK_STATUS_VALUES = [
  'ready',
  'needs_review',
  'quantity_not_tracked',
  'value_not_tracked',
] as const;

export const FINANCE_INVENTORY_INBOUND_MOVEMENT_TYPES = [
  'purchase',
  'return',
  'transfer_in',
  'opening_balance',
] as const;

export const FINANCE_INVENTORY_OUTBOUND_MOVEMENT_TYPES = [
  'sale',
  'damage',
  'loss',
  'transfer_out',
  'consumption',
] as const;

export type FinanceInventoryItemType =
  (typeof FINANCE_INVENTORY_ITEM_TYPE_VALUES)[number];

export type FinanceInventoryMovementType =
  (typeof FINANCE_INVENTORY_MOVEMENT_TYPE_VALUES)[number];

export type FinanceInventoryMovementStatus =
  (typeof FINANCE_INVENTORY_MOVEMENT_STATUS_VALUES)[number];

export type FinanceInventoryStockStatus =
  (typeof FINANCE_INVENTORY_STOCK_STATUS_VALUES)[number];
