import { z } from 'zod';

export const INVENTORY_LOCATION_TYPE_VALUES = [
  'warehouse',
  'store_room',
  'other',
] as const;

export const InventoryLocationTypeSchema = z.enum(
  INVENTORY_LOCATION_TYPE_VALUES
);

export const InventoryLocationBaseSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  type: InventoryLocationTypeSchema,
  is_active: z.boolean().default(true),
  description: z.string().trim().optional(),
});

export const CreateInventoryLocationSchema =
  InventoryLocationBaseSchema;
export const UpdateInventoryLocationSchema =
  InventoryLocationBaseSchema.partial();
export const InventoryLocationResponseSchema =
  InventoryLocationBaseSchema.extend({
    _id: z.string(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  });
