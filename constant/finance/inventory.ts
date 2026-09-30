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

export const FINANCE_INVENTORY_RESERVATION_STATUS_VALUES = [
  'active',
  'released',
  'consumed',
  'shortage',
  'blocked',
] as const;

export const FINANCE_INVENTORY_ADJUSTMENT_DIRECTION_VALUES =
  ['increase', 'decrease'] as const;

export const FINANCE_INVENTORY_ADJUSTMENT_REASON_VALUES = [
  'stock_count',
  'damage',
  'loss',
  'other',
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

export const FINANCE_INVENTORY_DEFAULT_ACCOUNT_BY_ITEM_TYPE =
  {
    merchandise: {
      subtype: 'merchandise_inventory',
      code: '1310',
    },
    packaging: {
      subtype: 'packaging_inventory',
      code: '1320',
    },
    supplies: {
      subtype: 'packaging_inventory',
      code: '1320',
    },
    fixed_asset: {
      subtype: 'packing_equipment',
      code: '1510',
    },
  } as const;

export const FINANCE_INVENTORY_DEFAULT_ADJUSTMENT_ACCOUNT =
  {
    subtype: 'inventory_shrinkage',
    code: '6900',
  } as const;

export const FINANCE_INVENTORY_DEFAULT_COGS_ACCOUNT_BY_ITEM_TYPE =
  {
    merchandise: {
      subtype: 'merchandise_cost',
      code: '5100',
    },
    packaging: {
      subtype: 'packaging_cost',
      code: '5200',
    },
    supplies: {
      subtype: 'packaging_expense',
      code: '6100',
    },
  } as const;

export type FinanceInventoryItemType =
  (typeof FINANCE_INVENTORY_ITEM_TYPE_VALUES)[number];

export type FinanceInventoryMovementType =
  (typeof FINANCE_INVENTORY_MOVEMENT_TYPE_VALUES)[number];

export type FinanceInventoryMovementStatus =
  (typeof FINANCE_INVENTORY_MOVEMENT_STATUS_VALUES)[number];

export type FinanceInventoryStockStatus =
  (typeof FINANCE_INVENTORY_STOCK_STATUS_VALUES)[number];

export type FinanceInventoryReservationStatus =
  (typeof FINANCE_INVENTORY_RESERVATION_STATUS_VALUES)[number];

export type FinanceInventoryAdjustmentDirection =
  (typeof FINANCE_INVENTORY_ADJUSTMENT_DIRECTION_VALUES)[number];

export type FinanceInventoryAdjustmentReason =
  (typeof FINANCE_INVENTORY_ADJUSTMENT_REASON_VALUES)[number];

export const FINANCE_INVENTORY_LOCATION_TYPE_VALUES = [
  'warehouse',
  'store_room',
  'other',
] as const;

export type FinanceInventoryLocationType =
  (typeof FINANCE_INVENTORY_LOCATION_TYPE_VALUES)[number];
