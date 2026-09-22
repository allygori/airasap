import { z } from 'zod';
import { ORDER_PLATFORM_VALUES } from '@/constant/order-platform';
import {
  FINANCE_SALES_PROJECTION_ISSUE_CODES,
  FINANCE_SALES_PROJECTION_STATUS_VALUES,
} from './finance-sales.constants';

const ObjectIdStringSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'ObjectId tidak valid');

const FinanceSalesOrderItemSourceSchema = z
  .object({
    product_reference_id: z
      .string()
      .trim()
      .max(80)
      .optional(),
    product_id: z.string().trim().max(160).optional(),
    variation_id: z.string().trim().max(160).optional(),
    product_name: z.string().trim().max(500).optional(),
    variation_name: z.string().trim().max(500).optional(),
    parent_sku: z.string().trim().max(160).optional(),
    child_sku: z.string().trim().max(160).optional(),
    quantity: z.number().int().nonnegative().optional(),
    returned_quantity: z
      .number()
      .int()
      .nonnegative()
      .optional(),
    final_quantity: z
      .number()
      .int()
      .nonnegative()
      .optional(),
    subtotal: z.number().int().nonnegative().optional(),
    gross_sales: z.number().int().nonnegative().optional(),
    net_sales: z.number().int().nonnegative().optional(),
    product_cost: z.number().int().nonnegative().optional(),
    total_product_cost: z
      .number()
      .int()
      .nonnegative()
      .optional(),
  })
  .strict();

/**
 * Finance-owned boundary for the subset of the existing order shape that is
 * relevant to future sales posting. It intentionally does not import the
 * Orders module or inherit its accounting side effects.
 */
export const FinanceSalesOrderSourceSchema = z
  .object({
    source_order_id: z.string().trim().min(1).max(160),
    source_order_number: z.string().trim().min(1).max(160),
    organization_id: ObjectIdStringSchema,
    store_id: ObjectIdStringSchema.optional(),
    platform: z.enum(ORDER_PLATFORM_VALUES),
    status: z.string().trim().max(80).optional(),
    currency: z
      .string()
      .trim()
      .length(3)
      .transform((value) => value.toUpperCase())
      .default('IDR'),
    placed_at: z.coerce.date().optional(),
    completed_at: z.coerce.date().optional(),
    released_funds_at: z.coerce.date().optional(),
    total_payment: z
      .number()
      .int()
      .nonnegative()
      .optional(),
    order_subtotal: z
      .number()
      .int()
      .nonnegative()
      .optional(),
    total_gross_sales: z
      .number()
      .int()
      .nonnegative()
      .optional(),
    released_funds: z
      .number()
      .int()
      .nonnegative()
      .optional(),
    items: z
      .array(FinanceSalesOrderItemSourceSchema)
      .max(500)
      .default([]),
  })
  .strict();

export const FinanceSalesProjectionIssueSchema = z.object({
  code: z.enum(FINANCE_SALES_PROJECTION_ISSUE_CODES),
  message: z.string().min(1),
});

export const FinanceSalesProjectionLineSchema = z.object({
  source_line_id: z.string().min(1),
  product_reference_id: z.string().nullable(),
  product_id: z.string().nullable(),
  variation_id: z.string().nullable(),
  product_name: z.string().nullable(),
  variation_name: z.string().nullable(),
  parent_sku: z.string().nullable(),
  child_sku: z.string().nullable(),
  quantity: z.number().int().nonnegative(),
  returned_quantity: z.number().int().nonnegative(),
  final_quantity: z.number().int().nonnegative(),
  subtotal: z.number().int().nonnegative().nullable(),
  gross_sales: z.number().int().nonnegative().nullable(),
  net_sales: z.number().int().nonnegative().nullable(),
  product_cost: z.number().int().nonnegative().nullable(),
  total_product_cost: z
    .number()
    .int()
    .nonnegative()
    .nullable(),
});

export const FinanceSalesProjectionSchema = z.object({
  source_order_id: z.string(),
  source_order_number: z.string(),
  organization_id: ObjectIdStringSchema,
  store_id: ObjectIdStringSchema.nullable(),
  platform: z.enum(ORDER_PLATFORM_VALUES),
  source_status: z.string().nullable(),
  currency: z.string().length(3),
  transaction_date: z.string().datetime().nullable(),
  released_funds_at: z.string().datetime().nullable(),
  total_payment: z.number().int().nonnegative().nullable(),
  sales_amount: z.number().int().nonnegative().nullable(),
  released_amount: z
    .number()
    .int()
    .nonnegative()
    .nullable(),
  lines: z.array(FinanceSalesProjectionLineSchema),
  readiness: z.enum(FINANCE_SALES_PROJECTION_STATUS_VALUES),
  issues: z.array(FinanceSalesProjectionIssueSchema),
});
