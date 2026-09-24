import { z } from 'zod';
import { FinanceSalesWorkflowResultSchema } from './finance-sales.schema';

const ObjectIdStringSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'ObjectId tidak valid');

export const FinanceOfflineSaleInputSchema = z
  .object({
    idempotency_key: z.string().uuid(),
    transaction_date: z.coerce.date(),
    payment_account_id: ObjectIdStringSchema,
    reference: z.string().trim().max(100).optional(),
    lines: z
      .array(
        z
          .object({
            product_id: ObjectIdStringSchema,
            variant_id: z
              .string()
              .trim()
              .min(1)
              .max(160)
              .optional(),
            quantity: z
              .number()
              .int()
              .positive()
              .max(100_000),
            unit_price: z
              .number()
              .int()
              .positive()
              .max(1_000_000_000_000),
          })
          .strict()
      )
      .min(1)
      .max(50),
  })
  .strict();

export const FinanceOfflineSaleStockOptionSchema = z.object(
  {
    key: z.string().min(1),
    product_id: ObjectIdStringSchema,
    product_name: z.string().min(1),
    variant_id: z.string().optional(),
    variant_name: z.string().optional(),
    platform: z.string().optional(),
    sku: z.string().nullable(),
    inventory_item_id: ObjectIdStringSchema,
    inventory_item_name: z.string().min(1),
    inventory_sku: z.string().min(1),
    unit: z.string().min(1),
    available_quantity: z.number().int().nonnegative(),
  }
);

export const FinanceOfflineSalePaymentAccountSchema =
  z.object({
    id: ObjectIdStringSchema,
    code: z.string(),
    name: z.string(),
    subtype: z.enum(['cash', 'bank', 'e_wallet']),
  });

export const FinanceOfflineSaleFormOptionsSchema = z.object(
  {
    products: z.array(FinanceOfflineSaleStockOptionSchema),
    payment_accounts: z.array(
      FinanceOfflineSalePaymentAccountSchema
    ),
  }
);

export const FinanceOfflineSaleResponseSchema = z.object({
  result: FinanceSalesWorkflowResultSchema,
});
