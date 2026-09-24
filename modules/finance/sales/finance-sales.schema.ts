import { z } from 'zod';
import { ORDER_PLATFORM_VALUES } from '@/constant/order-platform';
import {
  FINANCE_SALES_ACCOUNT_ROLE_VALUES,
  FINANCE_SALES_POSTING_DECISION_VALUES,
  FINANCE_SALES_POSTING_EVENT_VALUES,
  FINANCE_SALES_POSTING_MODE_VALUES,
  FINANCE_SALES_POSTING_REASON_CODES,
  FINANCE_SALES_PROJECTION_ISSUE_CODES,
  FINANCE_SALES_PROJECTION_STATUS_VALUES,
  FINANCE_SALES_TRANSACTION_STATUS_VALUES,
  FINANCE_SALES_INVENTORY_COGS_STATUS_VALUES,
} from './finance-sales.constants';

const ObjectIdStringSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'ObjectId tidak valid');

export const FinanceSalesPlatformSchema = z.union([
  z.enum(ORDER_PLATFORM_VALUES),
  z.literal('offline'),
]);

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
  platform: FinanceSalesPlatformSchema,
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

export const FinanceSalesPostingJournalLineIntentSchema = z
  .union([
    z
      .object({
        account_role: z.enum(
          FINANCE_SALES_ACCOUNT_ROLE_VALUES
        ),
        debit: z.number().int().nonnegative(),
        credit: z.number().int().nonnegative(),
      })
      .strict(),
    z
      .object({
        account_id: ObjectIdStringSchema,
        debit: z.number().int().nonnegative(),
        credit: z.number().int().nonnegative(),
      })
      .strict(),
  ])
  .refine(
    (line) =>
      (line.debit > 0 && line.credit === 0) ||
      (line.credit > 0 && line.debit === 0),
    'Posting intent line harus memiliki tepat satu sisi debit atau credit.'
  );

export const FinanceSalesInventoryCogsStatusSchema = z.enum(
  FINANCE_SALES_INVENTORY_COGS_STATUS_VALUES
);

export const FinanceSalesInventoryCogsIntentSchema =
  z.discriminatedUnion('status', [
    z.object({
      status: z.literal('deferred'),
      reason: z.string().min(1),
    }),
    z.object({
      status: z.literal('posted'),
      reason: z.string().nullable(),
    }),
  ]);

export const FinanceSalesPostingIntentSchema = z
  .object({
    source_order_id: z.string(),
    source_order_number: z.string(),
    source_event: z.enum(
      FINANCE_SALES_POSTING_EVENT_VALUES
    ),
    transaction_date: z.string().datetime(),
    currency: z.string().length(3),
    description: z.string().min(1),
    idempotency_key: z.string().min(1),
    lines: z
      .array(FinanceSalesPostingJournalLineIntentSchema)
      .min(2),
    inventory_cogs: FinanceSalesInventoryCogsIntentSchema,
  })
  .superRefine((intent, context) => {
    const totalDebit = intent.lines.reduce(
      (sum, line) => sum + line.debit,
      0
    );
    const totalCredit = intent.lines.reduce(
      (sum, line) => sum + line.credit,
      0
    );

    if (totalDebit !== totalCredit) {
      context.addIssue({
        code: 'custom',
        path: ['lines'],
        message:
          'Posting intent harus memiliki total debit dan credit yang seimbang.',
      });
    }
  });

export const FinanceSalesPostingDecisionSchema = z.object({
  decision: z.enum(FINANCE_SALES_POSTING_DECISION_VALUES),
  source_order_id: z.string(),
  source_status: z.string().nullable(),
  event: z
    .enum(FINANCE_SALES_POSTING_EVENT_VALUES)
    .nullable(),
  reason_code: z
    .enum(FINANCE_SALES_POSTING_REASON_CODES)
    .nullable(),
  message: z.string().min(1),
  intent: FinanceSalesPostingIntentSchema.nullable(),
});

export const FinanceSalesPostingModeSchema = z.enum(
  FINANCE_SALES_POSTING_MODE_VALUES
);

export const FinanceSalesTransactionStatusSchema = z.enum(
  FINANCE_SALES_TRANSACTION_STATUS_VALUES
);

export const FinanceSalesWorkflowResultSchema = z.object({
  status: z.enum([
    'disabled',
    'not_eligible',
    'pending',
    'blocked',
    'posted',
    'reversed',
  ]),
  mode: FinanceSalesPostingModeSchema,
  source_order_id: z.string(),
  transaction_id: z.string().nullable(),
  journal_entry_id: z.string().nullable(),
  reason: z.string().nullable(),
});

export const FinanceSalesTransactionListQuerySchema =
  z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(100)
      .default(25),
    status: FinanceSalesTransactionStatusSchema.optional(),
    posting_mode: FinanceSalesPostingModeSchema.optional(),
    search: z.string().trim().max(100).optional(),
  });

export const FinanceSalesTransactionSummarySchema =
  z.object({
    id: z.string(),
    source_order_id: z.string(),
    source_order_number: z.string(),
    store_id: z.string().nullable(),
    platform: z.string(),
    source_status: z.string().nullable(),
    transaction_date: z.string().datetime().nullable(),
    currency: z.string(),
    sales_amount: z.number().int().nonnegative().nullable(),
    posting_mode: FinanceSalesPostingModeSchema,
    status: FinanceSalesTransactionStatusSchema,
    idempotency_key: z.string(),
    blocked_reason: z.string().nullable(),
    journal_entry_id: z.string().nullable(),
    inventory_cogs_status:
      FinanceSalesInventoryCogsStatusSchema,
    inventory_cogs_deferred_reason: z.string().nullable(),
    inventory_cogs_total_cost: z
      .number()
      .int()
      .nonnegative()
      .nullable(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  });

export const FinanceSalesTransactionListResponseSchema =
  z.object({
    transactions: z.array(
      FinanceSalesTransactionSummarySchema
    ),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      total_pages: z.number().int().nonnegative(),
    }),
  });

export const FinanceSalesTransactionDetailSchema =
  FinanceSalesTransactionSummarySchema.extend({
    source_lines: z.array(FinanceSalesProjectionLineSchema),
    intent: FinanceSalesPostingIntentSchema.nullable(),
  });

export const FinanceSalesTransactionDetailResponseSchema =
  z.object({
    transaction: FinanceSalesTransactionDetailSchema,
  });
