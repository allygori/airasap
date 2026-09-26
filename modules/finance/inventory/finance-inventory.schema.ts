import { z } from 'zod';
import {
  FINANCE_INVENTORY_ITEM_TYPE_VALUES,
  FINANCE_INVENTORY_MOVEMENT_STATUS_VALUES,
  FINANCE_INVENTORY_MOVEMENT_TYPE_VALUES,
  FINANCE_INVENTORY_STOCK_STATUS_VALUES,
  FINANCE_INVENTORY_ADJUSTMENT_DIRECTION_VALUES,
  FINANCE_INVENTORY_ADJUSTMENT_REASON_VALUES,
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

export const FinanceInventoryAdjustmentDirectionSchema =
  z.enum(FINANCE_INVENTORY_ADJUSTMENT_DIRECTION_VALUES);

export const FinanceInventoryAdjustmentReasonSchema =
  z.enum(FINANCE_INVENTORY_ADJUSTMENT_REASON_VALUES);

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

export const FinanceInventoryMovementListQuerySchema =
  z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(100)
      .default(25),
    search: z.string().trim().max(100).optional(),
    movement_type: z
      .union([
        FinanceInventoryMovementTypeSchema,
        z.literal('all'),
      ])
      .default('all'),
    status: z
      .union([
        FinanceInventoryMovementStatusSchema,
        z.literal('all'),
      ])
      .default('posted'),
  });

export const FinanceInventoryMovementListItemSchema =
  z.object({
    id: ObjectIdStringSchema,
    inventory_item_id: ObjectIdStringSchema,
    sku: z.string().nullable(),
    item_name: z.string().nullable(),
    unit: z.string().nullable(),
    location_id: ObjectIdStringSchema,
    location_name: z.string().nullable(),
    movement_type: FinanceInventoryMovementTypeSchema,
    adjustment_direction:
      FinanceInventoryAdjustmentDirectionSchema.nullable(),
    adjustment_reason:
      FinanceInventoryAdjustmentReasonSchema.nullable(),
    status: FinanceInventoryMovementStatusSchema,
    quantity: z.number().nonnegative(),
    unit_cost: z.number().nonnegative().nullable(),
    total_cost: z.number().nonnegative().nullable(),
    occurred_at: z.string().datetime(),
    source_type: z.string().nullable(),
    source_id: z.string().nullable(),
    reference: z.string().nullable(),
    notes: z.string().nullable(),
    journal_entry_id: ObjectIdStringSchema.nullable(),
  });

export const FinanceInventoryMovementListResponseSchema =
  z.object({
    items: z.array(FinanceInventoryMovementListItemSchema),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      total_pages: z.number().int().nonnegative(),
    }),
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
  reserved_quantity: z.number().nullable(),
  sellable_quantity: z.number().nullable(),
  value_on_hand: z.number().nullable(),
  average_unit_cost: z.number().nullable(),
  track_quantity: z.boolean(),
  track_value: z.boolean(),
  mapping_count: z.number().int().nonnegative(),
  reservation_issue_count: z.number().int().nonnegative(),
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
      collection: z.literal('finance_inventory_movements'),
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

export const FinanceInventoryAdjustmentSchema = z
  .object({
    item_id: ObjectIdStringSchema,
    location_id: ObjectIdStringSchema,
    direction: FinanceInventoryAdjustmentDirectionSchema,
    reason: FinanceInventoryAdjustmentReasonSchema,
    quantity: z.coerce
      .number()
      .int()
      .positive()
      .max(1_000_000),
    unit_cost: z.coerce
      .number()
      .int()
      .positive()
      .max(1_000_000_000_000)
      .optional(),
    transaction_date: z.coerce
      .date()
      .default(() => new Date()),
    offset_account_id: ObjectIdStringSchema.optional(),
    notes: z.string().trim().max(500).optional(),
    idempotency_key: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.direction === 'increase' &&
      (value.reason === 'damage' || value.reason === 'loss')
    ) {
      context.addIssue({
        code: 'custom',
        path: ['direction'],
        message:
          'Damage atau loss hanya dapat mengurangi stok.',
      });
    }
  });

export const FinanceInventoryAdjustmentItemOptionSchema =
  z.object({
    id: ObjectIdStringSchema,
    sku: z.string().min(1),
    name: z.string().min(1),
    unit: z.string().min(1),
    track_value: z.boolean(),
  });

export const FinanceInventoryAdjustmentLocationOptionSchema =
  z.object({
    id: ObjectIdStringSchema,
    code: z.string().min(1),
    name: z.string().min(1),
  });

export const FinanceInventoryAdjustmentResponseSchema =
  z.object({
    movement_id: ObjectIdStringSchema,
    item_id: ObjectIdStringSchema,
    location_id: ObjectIdStringSchema,
    direction: FinanceInventoryAdjustmentDirectionSchema,
    reason: FinanceInventoryAdjustmentReasonSchema,
    status: z.literal('posted'),
    quantity: z.number().int().positive(),
    unit_cost: z.number().int().positive().nullable(),
    total_cost: z.number().int().positive().nullable(),
    journal_entry_id: ObjectIdStringSchema.nullable(),
    idempotency_key: z.string().min(1),
  });

const FinanceInventorySetupItemSchema = z.object({
  id: ObjectIdStringSchema,
  sku: z.string().min(1),
  name: z.string().min(1),
  item_type: FinanceInventoryItemTypeSchema,
  unit: z.string().min(1),
  track_quantity: z.boolean(),
  track_value: z.boolean(),
});

const FinanceInventorySetupLocationSchema = z.object({
  id: ObjectIdStringSchema,
  code: z.string().min(1),
  name: z.string().min(1),
});

export const FinanceInventorySetupQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(50),
  search: z.string().trim().max(100).optional(),
  item_search: z.string().trim().max(100).optional(),
});

export const FinanceInventorySetupActionSchema =
  z.discriminatedUnion('action', [
    z
      .object({
        action: z.literal('prepare_from_products'),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce
          .number()
          .int()
          .positive()
          .max(100)
          .default(50),
        search: z.string().trim().max(100).optional(),
      })
      .strict(),
    z
      .object({
        action: z.literal('ensure_default_location'),
      })
      .strict(),
    z
      .object({
        action: z.literal('create_manual'),
        sku: z.string().trim().min(1).max(80),
        name: z.string().trim().min(1).max(160),
        item_type: FinanceInventoryItemTypeSchema,
        unit: z
          .string()
          .trim()
          .min(1)
          .max(40)
          .default('pcs'),
        track_quantity: z.boolean().default(true),
        track_value: z.boolean().default(true),
      })
      .strict()
      .superRefine((value, context) => {
        if (value.track_value && !value.track_quantity) {
          context.addIssue({
            code: 'custom',
            path: ['track_value'],
            message:
              'Pelacakan nilai memerlukan pelacakan quantity.',
          });
        }
      }),
    z
      .object({
        action: z.literal('create_from_product'),
        product_id: ObjectIdStringSchema,
        variant_id: z
          .string()
          .trim()
          .min(1)
          .max(160)
          .optional(),
        sku: z.string().trim().min(1).max(80).optional(),
        name: z.string().trim().min(1).max(160).optional(),
        unit: z
          .string()
          .trim()
          .min(1)
          .max(40)
          .default('pcs'),
        track_quantity: z.boolean().default(true),
        track_value: z.boolean().default(true),
      })
      .strict()
      .superRefine((value, context) => {
        if (value.track_value && !value.track_quantity) {
          context.addIssue({
            code: 'custom',
            path: ['track_value'],
            message:
              'Pelacakan nilai memerlukan pelacakan quantity.',
          });
        }
      }),
    z
      .object({
        action: z.literal('map_product'),
        product_id: ObjectIdStringSchema,
        variant_id: z
          .string()
          .trim()
          .min(1)
          .max(160)
          .optional(),
        inventory_item_id: ObjectIdStringSchema,
      })
      .strict(),
  ]);

export const FinanceInventorySetupProductOptionSchema =
  z.object({
    key: z.string().min(1),
    product_id: ObjectIdStringSchema,
    product_name: z.string().min(1),
    platform: z.string().optional(),
    variant_id: z.string().optional(),
    variant_name: z.string().optional(),
    sku: z.string().nullable(),
    mapped_inventory_item:
      FinanceInventorySetupItemSchema.nullable(),
  });

export const FinanceInventorySetupResponseSchema = z.object(
  {
    product_options: z.array(
      FinanceInventorySetupProductOptionSchema
    ),
    product_pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      total_pages: z.number().int().nonnegative(),
    }),
    inventory_items: z.array(
      FinanceInventorySetupItemSchema
    ),
    inventory_item_pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      total_pages: z.number().int().nonnegative(),
    }),
    default_location:
      FinanceInventorySetupLocationSchema.nullable(),
  }
);

export const FinanceInventorySetupActionResponseSchema =
  z.discriminatedUnion('action', [
    z.object({
      action: z.literal('prepare_from_products'),
      summary: z.object({
        prepared: z.number().int().nonnegative(),
        already_mapped: z.number().int().nonnegative(),
        needs_review: z.number().int().nonnegative(),
      }),
      results: z.array(
        z.object({
          product_id: ObjectIdStringSchema,
          product_name: z.string().min(1),
          variant_id: z.string().optional(),
          variant_name: z.string().optional(),
          sku: z.string().nullable(),
          status: z.enum([
            'prepared',
            'already_mapped',
            'needs_review',
          ]),
          review_reason: z
            .enum([
              'missing_sku',
              'duplicate_source_sku',
              'existing_inventory_sku',
              'source_item_unavailable',
            ])
            .optional(),
          matched_item: z
            .object({
              id: ObjectIdStringSchema,
              name: z.string().min(1),
            })
            .optional(),
        })
      ),
    }),
    z.object({
      action: z.literal('ensure_default_location'),
      location: FinanceInventorySetupLocationSchema,
    }),
    z.object({
      action: z.literal('create_manual'),
      item: FinanceInventorySetupItemSchema,
      location: FinanceInventorySetupLocationSchema,
    }),
    z.object({
      action: z.literal('create_from_product'),
      item: FinanceInventorySetupItemSchema,
      location: FinanceInventorySetupLocationSchema,
      mapping_created: z.literal(true),
    }),
    z.object({
      action: z.literal('map_product'),
      item: FinanceInventorySetupItemSchema,
      location: FinanceInventorySetupLocationSchema,
      mapping_created: z.literal(true),
    }),
  ]);

export type FinanceInventoryStockQueryInput = z.input<
  typeof FinanceInventoryStockQuerySchema
>;

export type FinanceInventorySetupQueryInput = z.input<
  typeof FinanceInventorySetupQuerySchema
>;
