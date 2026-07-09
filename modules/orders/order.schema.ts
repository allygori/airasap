import { z } from 'zod';
import { ORDER_PLATFORM_VALUES } from '@/constant/order-platform';

export const OrderItemSchema = z.object({
  // product: z.string().min(1, 'Product ID wajib diisi'),
  product: z
    .string()
    .optional()
    .refine((val) => mongoose.isValidObjectId(val), {
      message: 'Mongoose ObjectId tidak valid',
    })
    .transform((val) => new mongoose.Types.ObjectId(val)),
  product_cost: z.number().int().optional(),
  profit: z.number().int().optional(),
  parent_sku: z.string().optional(),
  sku_reference_number: z.string().optional(),
  product_name: z.string().optional(),
  variation_name: z.string().optional(),
  // product_key: z.string().optional(),
  original_price: z.number().int().optional(),
  discount: z.number().optional(),
  price_after_discount: z.number().int().optional(),
  quantity: z.number().int().optional(),
  returned_quantity: z.number().int().optional(),
  subtotal: z.number().int().optional(),
  processing_fee: z.number().int().optional(), // @TODO update enrichWithReleasedIncome
  // cogs: z.number().optional(), // replaced with product_cost_amount
  // product_cost: z
  //   .string()
  //   .optional()
  //   .refine((val) => mongoose.isValidObjectId(val), {
  //     message: 'Mongoose ObjectId tidak valid',
  //   })
  //   .transform((val) => new mongoose.Types.ObjectId(val)),
  // product_cost_amount: z.number().optional(),
});

export const OrderAddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
});

export const OrderFeeSchema = z.object({
  admin_fee: z.number().int().optional().default(0),
  processing_fee: z.number().int().optional().default(0),
  affiliate_fee: z.number().int().optional().default(0), // shopee: AMS program, tokped: ?
  service_fee: z.number().int().optional().default(0),
  shipping_saver_program_fee: z
    .number()
    .int()
    .optional()
    .default(0), // shopee: gratis ongkir xtra/xtra+ program ??
  transaction_fee: z.number().int().optional().default(0),
  campaign_fee: z.number().int().optional().default(0),
  auto_top_up_fee_from_income: z
    .number()
    .int()
    .optional()
    .default(0),

  // shipping_cost_paid_by_buyer: z
  //   .number().int()
  //   .optional()
  //   .default(0),
  // shipping_cost_discount_by_logistics: z
  //   .number().int()
  //   .optional()
  //   .default(0),
  // shipping_cost_forwarded_by_shopee: z
  //   .number().int()
  //   .optional()
  //   .default(0),

  // return
  return_shipping_fee: z
    .number()
    .int()
    .optional()
    .default(0),
  return_to_sender_shipping_fee: z
    .number()
    .int()
    .optional()
    .default(0),

  // over charge shipping fee refund
  shipping_fee_refund: z
    .number()
    .int()
    .optional()
    .default(0),
});

export const OrderBaseSchema = z.object({
  // organization: z
  //   .string()
  //   .min(1, 'Organization ID wajib diisi'),
  // store: z.string().min(1, 'Store ID wajib diisi'),
  order_id: z.string().min(1, 'Order ID wajib diisi'),
  platform: z.enum(
    ORDER_PLATFORM_VALUES,
    'Platform tidak valid'
  ),
  // order_id: z.string().optional(),
  status: z.string().optional(),
  cancelled_by: z.string().optional(),
  cancellation_reason: z.string().optional(),
  cancellation_return_status: z.string().optional(),
  username: z.string().optional(),
  number_of_products_ordered: z.number().int().optional(),
  total_payment: z.number().int().optional(),
  payment_method: z.string().optional(),
  paid_at: z.string().optional(),
  order_subtotal: z.number().int().optional(),
  total_discount: z.number().int().optional(),
  discount_from_seller: z.number().int().optional(),
  discount_from_shopee: z.number().int().optional(),
  voucher_borne_by_seller: z.number().int().optional(),
  voucher_borne_by_shopee: z.number().int().optional(),
  voucher_code: z.string().optional(),
  coin_cashback: z.number().int().optional(),
  bundle_deal: z.boolean().optional(),
  bundle_deal_discount_from_shopee: z
    .number()
    .int()
    .optional(),
  bundle_deal_discount_from_seller: z
    .number()
    .int()
    .optional(),
  shopee_coin_offset: z.number().int().optional(),
  credit_card_discount: z.number().int().optional(),
  shipping_option: z.string().optional(),
  estimated_shipping_cost: z.number().int().optional(),
  free_shipping_from_shopee: z.number().int().optional(),
  shipping_cost_paid_by_buyer: z.number().int().optional(),
  shipping_cost_discount_by_logistics: z
    .number()
    .optional()
    .default(0),
  shipping_cost_forwarded_by_shopee: z
    .number()
    .optional()
    .default(0),
  estimated_shipping_cost_discount: z
    .number()
    .int()
    .optional(),
  product_weight: z.number().optional(),
  total_weight: z.number().optional(),
  receiver_name: z.string().optional(),
  phone_number: z.string().optional(),
  address: OrderAddressSchema.optional(),
  fee: OrderFeeSchema.optional(),
  buyer_note: z.string().optional(),
  note: z.string().optional(),
  items: z.array(OrderItemSchema).optional(),
  free_shipping_promo_from_seller: z
    .number()
    .int()
    .optional()
    .default(0),
  compensation: z.number().int().optional().default(0),
  // admin_fee: z.number().optional(),
  // order_process_fee: z.number().optional(),
  // affiliate_fee: z.number().optional(),
  // campaign_fee: z.number().optional(),
  // voucher_fee: z.number().optional(),
  // shipping_fee: z.number().optional(),
  // other_fee: z.number().optional(),
  // return_shipping_fee: z.number().optional(),
  released_amount: z.number().optional(),
  net_amount: z.number().optional(),
  shipping_arranged_at: z.string().optional(),
  placed_at: z.string().optional(),
  released_funds_at: z.string().optional(),
  completed_at: z.string().optional(),

  // additional fields
  total_product_cost: z.number().int().optional(),
  total_profit: z.number().int().optional(),
  enriched_at: z.string().nullable().optional(),
  /**
   * @TODO implement
   */
  // enrichments: z.array(z.object({
  //   file: z
  //   .string()
  //   .refine((val) => mongoose.isValidObjectId(val), {
  //     message: 'Mongoose ObjectId tidak valid',
  //   })
  //   .transform((val) => new mongoose.Types.ObjectId(val)),
  //   enriched_by: z.string(),
  //   enriched_at: z.string(),
  // })),
  deleted_at: z.string().nullable().optional(),
});

export const CreateOrderSchema = OrderBaseSchema;
export const UpdateOrderSchema = OrderBaseSchema.partial();

export const OrderResponseSchema = OrderBaseSchema.extend({
  _id: z.string(),
  organization: z.string().optional(),
  store: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  deleted_at: z.string().nullable().optional(),
});

export const OrderFilterSchema = z.object({
  platform: z.string().optional(),
  status: z.string().optional(),
  q: z.string().optional(),
  search: z.string().optional(),
  populate: z.string().optional(),
  sort: z.string().optional(),
  page: z.preprocess((v) => {
    if (typeof v === 'string' && v.length) {
      const n = Number(v);
      return Number.isNaN(n) ? v : n;
    }
    return v;
  }, z.number().int().positive().optional().default(1)),
  limit: z.preprocess((v) => {
    if (typeof v === 'string' && v.length) {
      const n = Number(v);
      return Number.isNaN(n) ? v : n;
    }
    return v;
  }, z.number().int().positive().optional().default(10)),
});

export const OrderSearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query wajib diisi'),
});

export const OrderIdParamsSchema = z.object({
  id: z.string().min(1, 'Order ID tidak valid'),
});

export const PlatformOrderIdParamsSchema = z.object({
  order_id: z
    .string()
    .min(1, 'Platform Order ID tidak valid'),
});

export const BulkUpdateStatusSchema = z.object({
  order_ids: z
    .array(z.string())
    .min(1, 'Minimal satu order dipilih'),
  is_active: z.boolean(),
});

export const MassUploadResponseSchema = z.object({
  created_count: z.number(),
  updated_count: z.number(),
  total_rows: z.number(),
  total_orders: z.number(),
});
