import { z } from 'zod';

export const INVENTORY_ITEM_TYPE_VALUES = [
  'merchandise',
  'packaging',
  'supplies',
  'fixed_asset',
] as const;

export const InventoryItemTypeSchema = z.enum(
  INVENTORY_ITEM_TYPE_VALUES
);

export const InventoryItemBaseSchema = z.object({
  sku: z.string().trim().min(1),
  name: z.string().trim().min(1),
  item_type: InventoryItemTypeSchema,
  unit: z.string().trim().min(1),
  track_quantity: z.boolean().default(true),
  track_value: z.boolean().default(true),
  inventory_account: z.string().min(1).optional(),
  cogs_account: z.string().min(1).optional(),
  reorder_point: z.number().int().nonnegative().optional(),
  is_active: z.boolean().default(true),
  description: z.string().trim().optional(),
});

export const CreateInventoryItemSchema =
  InventoryItemBaseSchema;
export const UpdateInventoryItemSchema =
  InventoryItemBaseSchema.partial();
export const InventoryItemResponseSchema =
  InventoryItemBaseSchema.extend({
    _id: z.string(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  });
