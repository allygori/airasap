import {
  CreateInventoryMovementSchema,
  InventoryMovementBaseSchema,
  InventoryMovementResponseSchema,
  InventoryMovementStatusSchema,
  InventoryMovementTypeSchema,
  UpdateInventoryMovementSchema,
} from './inventory-movement.schema';

export type InventoryMovementTypeDTO = ReturnType<
  typeof InventoryMovementTypeSchema.parse
>;
export type InventoryMovementStatusDTO = ReturnType<
  typeof InventoryMovementStatusSchema.parse
>;
export type InventoryMovementBaseDTO = ReturnType<
  typeof InventoryMovementBaseSchema.parse
>;
export type CreateInventoryMovementDTO = ReturnType<
  typeof CreateInventoryMovementSchema.parse
>;
export type UpdateInventoryMovementDTO = ReturnType<
  typeof UpdateInventoryMovementSchema.parse
>;
export type InventoryMovementResponseDTO = ReturnType<
  typeof InventoryMovementResponseSchema.parse
>;
