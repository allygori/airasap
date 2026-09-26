import {
  FinanceInventoryBalanceSchema,
  FinanceInventoryItemSourceSchema,
  FinanceInventoryMovementStatusSchema,
  FinanceInventoryMovementTypeSchema,
  FinanceInventoryStockMovementSourceSchema,
  FinanceInventoryStockQuerySchema,
  FinanceInventoryStockResponseSchema,
  FinanceInventoryMovementListQuerySchema,
  FinanceInventoryMovementListResponseSchema,
  FinanceInventoryStockStatusSchema,
  FinanceInventoryItemTypeSchema,
  FinanceInventoryAdjustmentSchema,
  FinanceInventoryAdjustmentDirectionSchema,
  FinanceInventoryAdjustmentReasonSchema,
  FinanceInventoryAdjustmentItemOptionSchema,
  FinanceInventoryAdjustmentLocationOptionSchema,
  FinanceInventoryAdjustmentResponseSchema,
  FinanceInventorySetupActionResponseSchema,
  FinanceInventorySetupActionSchema,
  FinanceInventorySetupProductOptionSchema,
  FinanceInventorySetupQuerySchema,
  FinanceInventorySetupResponseSchema,
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

export type FinanceInventoryMovementListQueryDTO =
  ReturnType<
    typeof FinanceInventoryMovementListQuerySchema.parse
  >;

export type FinanceInventoryMovementListResponseDTO =
  ReturnType<
    typeof FinanceInventoryMovementListResponseSchema.parse
  >;

export type FinanceInventoryAdjustmentDTO = ReturnType<
  typeof FinanceInventoryAdjustmentSchema.parse
>;

export type FinanceInventoryAdjustmentDirectionDTO =
  ReturnType<
    typeof FinanceInventoryAdjustmentDirectionSchema.parse
  >;

export type FinanceInventoryAdjustmentReasonDTO =
  ReturnType<
    typeof FinanceInventoryAdjustmentReasonSchema.parse
  >;

export type FinanceInventoryAdjustmentItemOptionDTO =
  ReturnType<
    typeof FinanceInventoryAdjustmentItemOptionSchema.parse
  >;

export type FinanceInventoryAdjustmentLocationOptionDTO =
  ReturnType<
    typeof FinanceInventoryAdjustmentLocationOptionSchema.parse
  >;

export type FinanceInventoryAdjustmentResponseDTO =
  ReturnType<
    typeof FinanceInventoryAdjustmentResponseSchema.parse
  >;

export type FinanceInventoryStockMovementSourceDTO =
  ReturnType<
    typeof FinanceInventoryStockMovementSourceSchema.parse
  >;

export type FinanceInventorySetupQueryDTO = ReturnType<
  typeof FinanceInventorySetupQuerySchema.parse
>;

export type FinanceInventorySetupActionInputDTO =
  ReturnType<
    typeof FinanceInventorySetupActionSchema.parse
  >;

export type FinanceInventorySetupProductOptionDTO =
  ReturnType<
    typeof FinanceInventorySetupProductOptionSchema.parse
  >;

export type FinanceInventorySetupResponseDTO = ReturnType<
  typeof FinanceInventorySetupResponseSchema.parse
>;

export type FinanceInventorySetupActionResponseDTO =
  ReturnType<
    typeof FinanceInventorySetupActionResponseSchema.parse
  >;
