import {
  FinanceInventoryBalanceSchema,
  FinanceInventoryItemSourceSchema,
  FinanceInventoryMovementStatusSchema,
  FinanceInventoryMovementTypeSchema,
  FinanceInventoryStockMovementSourceSchema,
  FinanceInventoryStockQuerySchema,
  FinanceInventoryStockResponseSchema,
  FinanceInventoryStockStatusSchema,
  FinanceInventoryItemTypeSchema,
} from './finance-inventory.schema';

export type FinanceInventoryItemTypeDTO = ReturnType<
  typeof FinanceInventoryItemTypeSchema.parse
>;

export type FinanceInventoryMovementTypeDTO = ReturnType<
  typeof FinanceInventoryMovementTypeSchema.parse
>;

export type FinanceInventoryMovementStatusDTO = ReturnType<
  typeof FinanceInventoryMovementStatusSchema.parse
>;

export type FinanceInventoryStockStatusDTO = ReturnType<
  typeof FinanceInventoryStockStatusSchema.parse
>;

export type FinanceInventoryStockQueryDTO = ReturnType<
  typeof FinanceInventoryStockQuerySchema.parse
>;

export type FinanceInventoryItemSourceDTO = ReturnType<
  typeof FinanceInventoryItemSourceSchema.parse
>;

export type FinanceInventoryBalanceDTO = ReturnType<
  typeof FinanceInventoryBalanceSchema.parse
>;

export type FinanceInventoryStockResponseDTO = ReturnType<
  typeof FinanceInventoryStockResponseSchema.parse
>;

export type FinanceInventoryStockMovementSourceDTO =
  ReturnType<
    typeof FinanceInventoryStockMovementSourceSchema.parse
  >;
