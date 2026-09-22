import { z } from 'zod';
import {
  FINANCE_PURCHASE_PAYMENT_TIMING_VALUES,
  FINANCE_PURCHASE_STATUS_VALUES,
} from './finance-purchase.constants';

const ObjectIdStringSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'ObjectId tidak valid');

export const FinancePurchaseStatusSchema = z.enum(
  FINANCE_PURCHASE_STATUS_VALUES
);

export const FinancePurchasePaymentTimingSchema = z.enum(
  FINANCE_PURCHASE_PAYMENT_TIMING_VALUES
);

export const FinancePurchaseLineInputSchema = z.object({
  item_id: ObjectIdStringSchema,
  location_id: ObjectIdStringSchema,
  quantity: z.coerce
    .number()
    .int()
    .positive()
    .max(1_000_000),
  unit_cost: z.coerce
    .number()
    .int()
    .positive()
    .max(1_000_000_000),
});

export const FinancePurchaseInputSchema = z
  .object({
    supplier_name: z.string().trim().max(160).optional(),
    supplier_reference: z
      .string()
      .trim()
      .max(120)
      .optional(),
    transaction_date: z.coerce.date(),
    payment_timing: FinancePurchasePaymentTimingSchema,
    payment_account_id: ObjectIdStringSchema.optional(),
    lines: z
      .array(FinancePurchaseLineInputSchema)
      .min(1)
      .max(100),
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
    const totalAmount = value.lines.reduce(
      (sum, line) => sum + line.quantity * line.unit_cost,
      0
    );
    if (!Number.isSafeInteger(totalAmount)) {
      context.addIssue({
        code: 'custom',
        path: ['lines'],
        message:
          'Total purchase melebihi batas nominal yang aman.',
      });
    }

    if (
      value.payment_timing === 'paid' &&
      !value.payment_account_id
    ) {
      context.addIssue({
        code: 'custom',
        path: ['payment_account_id'],
        message:
          'Akun pembayaran wajib dipilih untuk purchase yang sudah dibayar.',
      });
    }

    if (
      value.payment_timing === 'payable' &&
      value.payment_account_id
    ) {
      context.addIssue({
        code: 'custom',
        path: ['payment_account_id'],
        message:
          'Akun pembayaran tidak boleh diisi ketika purchase menjadi utang.',
      });
    }
  });

export const FinancePurchaseLineResponseSchema = z.object({
  item_id: ObjectIdStringSchema,
  item_sku: z.string().min(1),
  item_name: z.string().min(1),
  location_id: ObjectIdStringSchema,
  location_code: z.string().min(1),
  location_name: z.string().min(1),
  quantity: z.number().int().positive(),
  unit_cost: z.number().int().positive(),
  line_total: z.number().int().positive(),
});

export const FinancePurchaseAccountResponseSchema =
  z.object({
    id: ObjectIdStringSchema,
    code: z.string().min(1),
    name: z.string().min(1),
  });

export const FinancePurchaseResponseSchema = z.object({
  purchase_id: ObjectIdStringSchema,
  supplier_name: z.string().nullable(),
  supplier_reference: z.string().nullable(),
  transaction_date: z.string().datetime(),
  payment_timing: FinancePurchasePaymentTimingSchema,
  payment_account:
    FinancePurchaseAccountResponseSchema.nullable(),
  offset_account:
    FinancePurchaseAccountResponseSchema.nullable(),
  lines: z.array(FinancePurchaseLineResponseSchema),
  inventory_movement_ids: z.array(ObjectIdStringSchema),
  total_amount: z.number().int().positive(),
  notes: z.string().nullable(),
  status: FinancePurchaseStatusSchema,
  journal_entry_id: ObjectIdStringSchema.nullable(),
  idempotency_key: z.string().min(1),
  replayed: z.boolean(),
});

export const FinancePurchaseSummarySchema =
  FinancePurchaseResponseSchema.omit({
    lines: true,
    replayed: true,
  });

export const FinancePurchaseListQuerySchema = z
  .object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .max(1000)
      .default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(25),
    status: FinancePurchaseStatusSchema.optional(),
    search: z.string().trim().max(100).optional(),
  })
  .strict();

export const FinancePurchaseListResponseSchema = z.object({
  purchases: z.array(FinancePurchaseSummarySchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
});

export const FinancePurchaseDetailResponseSchema = z.object(
  {
    purchase: FinancePurchaseResponseSchema.omit({
      replayed: true,
    }),
  }
);
