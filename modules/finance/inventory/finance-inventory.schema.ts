import { z } from 'zod';
import {
  FINANCE_INVENTORY_ITEM_TYPE_VALUES,
  FINANCE_INVENTORY_MOVEMENT_STATUS_VALUES,
  FINANCE_INVENTORY_MOVEMENT_TYPE_VALUES,
  FINANCE_INVENTORY_STOCK_STATUS_VALUES,
} from './finance-inventory.constants';

const ObjectIdStringSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'ObjectId tidak valid');

export const FinanceInventoryItemTypeSchema = z.enum(
  FINANCE_INVENTORY_ITEM_TYPE_VALUES
);

export const FinanceInventoryMovementTypeSchema = z.enum(
  FINANCE_INVENTORY_MOVEMENT_TYPE_VALUES
);

export const FinanceInventoryMovementStatusSchema = z.enum(
  FINANCE_INVENTORY_MOVEMENT_STATUS_VALUES
);

export const FinanceInventoryStockStatusSchema = z.enum(
  FINANCE_INVENTORY_STOCK_STATUS_VALUES
);

export const FinanceInventoryStockQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(25),
  search: z.string().trim().max(100).optional(),
  item_type: FinanceInventoryItemTypeSchema.optional(),
  location_id: ObjectIdStringSchema.optional(),
});

export const FinanceInventoryItemSourceSchema = z.object({
  id: ObjectIdStringSchema,
  sku: z.string().min(1),
  name: z.string().min(1),
  item_type: FinanceInventoryItemTypeSchema,
  unit: z.string().min(1),
  track_quantity: z.boolean(),
  track_value: z.boolean(),
  is_active: z.boolean(),
});

export const FinanceInventoryBalanceSchema = z.object({
  item_id: ObjectIdStringSchema,
  sku: z.string().min(1),
  name: z.string().min(1),
  item_type: FinanceInventoryItemTypeSchema,
  unit: z.string().min(1),
  quantity_on_hand: z.number().nullable(),
  value_on_hand: z.number().nullable(),
  average_unit_cost: z.number().nullable(),
  track_quantity: z.boolean(),
  track_value: z.boolean(),
  mapping_count: z.number().int().nonnegative(),
  location_count: z.number().int().nonnegative(),
  unresolved_movement_count: z.number().int().nonnegative(),
  missing_cost_movement_count: z
    .number()
    .int()
    .nonnegative(),
  status: FinanceInventoryStockStatusSchema,
});

export const FinanceInventoryStockResponseSchema = z.object(
  {
    items: z.array(FinanceInventoryBalanceSchema),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      total_pages: z.number().int().nonnegative(),
    }),
    source: z.object({
      collection: z.literal('inventory_movements'),
      status: z.literal('posted'),
      costing_note: z.string().min(1),
    }),
  }
);

export const FinanceInventoryStockMovementSourceSchema =
  z.object({
    id: ObjectIdStringSchema,
    item_id: ObjectIdStringSchema,
    location_id: ObjectIdStringSchema,
    movement_type: FinanceInventoryMovementTypeSchema,
    status: FinanceInventoryMovementStatusSchema,
    quantity: z.number().int().positive(),
    unit_cost: z.number().int().nonnegative().nullable(),
    total_cost: z.number().int().nonnegative().nullable(),
    occurred_at: z.string().datetime(),
  });

export type FinanceInventoryStockQueryInput = z.input<
  typeof FinanceInventoryStockQuerySchema
>;
