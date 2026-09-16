import { z } from 'zod';

export const INVENTORY_MOVEMENT_TYPE_VALUES = [
  'purchase',
  'sale',
  'return',
  'damage',
  'loss',
  'adjustment',
  'transfer_in',
  'transfer_out',
  'consumption',
] as const;

export const INVENTORY_MOVEMENT_STATUS_VALUES = [
  'draft',
  'posted',
  'voided',
] as const;

export const InventoryMovementTypeSchema = z.enum(
  INVENTORY_MOVEMENT_TYPE_VALUES
);
export const InventoryMovementStatusSchema = z.enum(
  INVENTORY_MOVEMENT_STATUS_VALUES
);

export const InventoryMovementBaseSchema = z.object({
  inventory_item: z.string().min(1),
  location: z.string().min(1),
  store: z.string().min(1).optional(),
  platform: z.string().min(1).optional(),
  movement_type: InventoryMovementTypeSchema,
  quantity: z.number().int().positive(),
  unit_cost: z.number().int().nonnegative().optional(),
  total_cost: z.number().int().nonnegative().optional(),
  occurred_at: z.string().min(1),
  source_type: z.string().trim().min(1).optional(),
  source_id: z.string().trim().min(1).optional(),
  offset_account: z.string().min(1).optional(),
  idempotency_key: z.string().trim().min(1).optional(),
  reference: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  status: InventoryMovementStatusSchema.default('draft'),
});

export const CreateInventoryMovementSchema =
  InventoryMovementBaseSchema;
export const UpdateInventoryMovementSchema =
  InventoryMovementBaseSchema.partial();
export const InventoryMovementResponseSchema =
  InventoryMovementBaseSchema.extend({
    _id: z.string(),
    journal_entry: z.string().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  });
