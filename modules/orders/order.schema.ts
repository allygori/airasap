import { z } from 'zod';
import { PLATFORMS } from '../constant';

const platforms = [...PLATFORMS] as const;

export const OrderItemSchema = z.object({
  // product: z.string().min(1, 'Product ID wajib diisi'),
  product: z
    .string()
    .optional()
    .refine((val) => mongoose.isValidObjectId(val), {
      message: 'Mongoose ObjectId tidak valid',
    })
    .transform((val) => new mongoose.Types.ObjectId(val)),
  parent_sku: z.string().optional(),
  sku_reference_number: z.string().optional(),
  product_name: z.string().optional(),
  variation_name: z.string().optional(),
  product_key: z.string().optional(),
  original_price: z.number().optional(),
  price_after_discount: z.number().optional(),
  quantity: z.number().int().optional(),
  returned_quantity: z.number().int().optional(),
  cogs: z.number().optional(),
});

export const OrderAddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
});

export const OrderBaseSchema = z.object({
  // organization: z
  //   .string()
  //   .min(1, 'Organization ID wajib diisi'),
  // store: z.string().min(1, 'Store ID wajib diisi'),
  order_id: z.string().min(1, 'Order ID wajib diisi'),
  platform: z.enum(platforms, 'Platform tidak valid'),
  // order_id: z.string().optional(),
  status: z.string().optional(),
  cancellation_return_status: z.string().optional(),
  username: z.string().optional(),
  number_of_products_ordered: z.number().optional(),
  total_payment: z.number().optional(),
  payment_method: z.string().optional(),
  paid_at: z.string().optional(),
  order_subtotal: z.number().optional(),
  total_discount: z.number().optional(),
  discount_from_seller: z.number().optional(),
  discount_from_shopee: z.number().optional(),
  voucher_borne_by_seller: z.number().optional(),
  voucher_borne_by_shopee: z.number().optional(),
  coin_cashback: z.number().optional(),
  bundle_deal: z.boolean().optional(),
  bundle_deal_discount_from_shopee: z.number().optional(),
  bundle_deal_discount_from_seller: z.number().optional(),
  shopee_coin_offset: z.number().optional(),
  credit_card_discount: z.number().optional(),
  shipping_option: z.string().optional(),
  estimated_shipping_fee: z.number().optional(),
  shipping_fee_paid_by_buyer: z.number().optional(),
  estimated_shipping_fee_discount: z.number().optional(),
  product_weight: z.number().optional(),
  total_weight: z.number().optional(),
  receiver_name: z.string().optional(),
  phone_number: z.string().optional(),
  address: OrderAddressSchema.optional(),
  buyer_note: z.string().optional(),
  note: z.string().optional(),
  items: z.array(OrderItemSchema).optional(),
  admin_fee: z.number().optional(),
  order_process_fee: z.number().optional(),
  affiliate_fee: z.number().optional(),
  campaign_fee: z.number().optional(),
  voucher_fee: z.number().optional(),
  shipping_fee: z.number().optional(),
  other_fee: z.number().optional(),
  return_shipping_fee: z.number().optional(),
  released_amount: z.number().optional(),
  net_amount: z.number().optional(),
  shipping_arranged_at: z.string().optional(),
  order_created_at: z.string().optional(),
  order_released_at: z.string().optional(),
  order_completed_at: z.string().optional(),
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
