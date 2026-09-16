import { z } from 'zod';
import {
  CreateInventoryItemMappingSchema,
  InventoryItemMappingBaseSchema,
  InventoryItemMappingResponseSchema,
  UpdateInventoryItemMappingSchema,
} from './inventory-item-mapping.schema';

export type InventoryItemMappingBaseDTO = z.infer<
  typeof InventoryItemMappingBaseSchema
>;
export type CreateInventoryItemMappingDTO = z.infer<
  typeof CreateInventoryItemMappingSchema
>;
export type UpdateInventoryItemMappingDTO = z.infer<
  typeof UpdateInventoryItemMappingSchema
>;
export type InventoryItemMappingResponseDTO = z.infer<
  typeof InventoryItemMappingResponseSchema
>;
