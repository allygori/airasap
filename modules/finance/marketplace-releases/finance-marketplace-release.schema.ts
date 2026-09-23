import { z } from 'zod';
import { ORDER_PLATFORM_VALUES } from '@/constant/order-platform';

const ObjectIdStringSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'ObjectId tidak valid');

const FeeAmountSchema = z
  .number()
  .int()
  .nonnegative()
  .default(0);

export const FinanceMarketplaceReleaseFeeSchema = z
  .object({
    admin_fee: FeeAmountSchema,
    processing_fee: FeeAmountSchema,
    affiliate_fee: FeeAmountSchema,
    gox_fee: FeeAmountSchema,
    service_fee: FeeAmountSchema,
    shipping_saver_program_fee: FeeAmountSchema,
    transaction_fee: FeeAmountSchema,
    campaign_fee: FeeAmountSchema,
    other_fee: FeeAmountSchema,
    premium_fee: FeeAmountSchema,
    fbs_fee: FeeAmountSchema,
    tax_pph22: FeeAmountSchema,
    import_duty_vat_income_tax: FeeAmountSchema,
    auto_top_up_fee_from_income: FeeAmountSchema,
    return_shipping_fee: FeeAmountSchema,
    return_to_sender_shipping_fee: FeeAmountSchema,
    shipping_fee_refund: FeeAmountSchema,
    refund_to_buyer: FeeAmountSchema,
  })
  .strict();

export const FinanceMarketplaceReleaseSourceSchema = z
  .object({
    source_order_reference: ObjectIdStringSchema,
    source_order_id: z.string().trim().min(1).max(160),
    source_order_number: z.string().trim().min(1).max(160),
    organization_id: ObjectIdStringSchema,
    store_id: ObjectIdStringSchema.optional(),
    platform: z.enum(ORDER_PLATFORM_VALUES),
    settlement_reference: z
      .string()
      .trim()
      .max(160)
      .optional(),
    released_at: z.coerce.date().optional(),
    released_amount: z
      .number()
      .int()
      .nonnegative()
      .optional(),
    source_file_id: ObjectIdStringSchema.optional(),
    has_returns: z.boolean().default(false),
    fee: FinanceMarketplaceReleaseFeeSchema,
  })
  .strict();

export const FinanceMarketplaceReleaseStatusSchema = z.enum(
  ['pending', 'blocked', 'posted']
);

export const FinanceMarketplaceReleaseFeeLineSchema = z
  .object({
    category: z.string().trim().min(1).max(80),
    amount: z.number().int().positive(),
  })
  .strict();

export const FinanceMarketplaceReleaseResponseSchema = z
  .object({
    id: z.string().nullable(),
    status: z.enum([
      'disabled',
      'pending',
      'blocked',
      'posted',
    ]),
    source_order_id: z.string(),
    journal_entry_id: z.string().nullable(),
    reason: z.string().nullable(),
    expected_gross_amount: z
      .number()
      .int()
      .nonnegative()
      .nullable(),
    fee_amount: z.number().int().nonnegative().nullable(),
    refund_amount: z
      .number()
      .int()
      .nonnegative()
      .nullable(),
    released_amount: z
      .number()
      .int()
      .nonnegative()
      .nullable(),
    reconciliation_difference: z.number().int().nullable(),
  })
  .strict();

export type FinanceMarketplaceReleaseSourceDTO = z.infer<
  typeof FinanceMarketplaceReleaseSourceSchema
>;

export type FinanceMarketplaceReleaseSourceInputDTO =
  z.input<typeof FinanceMarketplaceReleaseSourceSchema>;

export type FinanceMarketplaceReleaseFeeLineDTO = z.infer<
  typeof FinanceMarketplaceReleaseFeeLineSchema
>;

export type FinanceMarketplaceReleaseStatusDTO = z.infer<
  typeof FinanceMarketplaceReleaseStatusSchema
>;

export type FinanceMarketplaceReleaseResponseDTO = z.infer<
  typeof FinanceMarketplaceReleaseResponseSchema
>;
