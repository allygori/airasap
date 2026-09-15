import {
  CreateInventoryItemSchema,
  InventoryItemBaseSchema,
  InventoryItemResponseSchema,
  UpdateInventoryItemSchema,
} from './inventory-item.schema';

export type InventoryItemBaseDTO = ReturnType<
  typeof InventoryItemBaseSchema.parse
>;
export type CreateInventoryItemDTO = ReturnType<
  typeof CreateInventoryItemSchema.parse
>;
export type UpdateInventoryItemDTO = ReturnType<
  typeof UpdateInventoryItemSchema.parse
>;
export type InventoryItemResponseDTO = ReturnType<
  typeof InventoryItemResponseSchema.parse
>;
