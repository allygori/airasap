import { z } from 'zod';

export const INVENTORY_ITEM_MAPPING_METHOD_VALUES = [
  'manual',
  'sku',
  'product_match',
  'imported',
] as const;

export const InventoryItemMappingMethodSchema = z.enum(
  INVENTORY_ITEM_MAPPING_METHOD_VALUES
);

export const InventoryItemMappingBaseSchema = z.object({
  product: z.string().trim().min(1),
  variant_id: z.string().trim().min(1).optional(),
  inventory_item: z.string().trim().min(1),
  mapping_method:
    InventoryItemMappingMethodSchema.default('manual'),
  is_active: z.boolean().default(true),
  notes: z.string().trim().optional(),
});

export const CreateInventoryItemMappingSchema =
  InventoryItemMappingBaseSchema;
export const UpdateInventoryItemMappingSchema =
  InventoryItemMappingBaseSchema.partial();
export const InventoryItemMappingResponseSchema =
  InventoryItemMappingBaseSchema.extend({
    _id: z.string(),
    variant_key: z.string(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  });
