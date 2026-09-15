import {
  CreateInventoryLocationSchema,
  InventoryLocationBaseSchema,
  InventoryLocationResponseSchema,
  UpdateInventoryLocationSchema,
} from './inventory-location.schema';

export type InventoryLocationBaseDTO = ReturnType<
  typeof InventoryLocationBaseSchema.parse
>;
export type CreateInventoryLocationDTO = ReturnType<
  typeof CreateInventoryLocationSchema.parse
>;
export type UpdateInventoryLocationDTO = ReturnType<
  typeof UpdateInventoryLocationSchema.parse
>;
export type InventoryLocationResponseDTO = ReturnType<
  typeof InventoryLocationResponseSchema.parse
>;
