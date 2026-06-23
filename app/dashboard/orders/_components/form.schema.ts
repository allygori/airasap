import z from 'zod';
import { PLATFORMS } from '@/lib/db/constant';

export const orderItemSchema = z.object({
  product: z.string().optional(),
  parent_sku: z.string().optional(),
  sku_reference_number: z.string().optional(),
  product_name: z.string().optional(),
  variation_name: z.string().optional(),
  product_key: z.string().optional(),
  original_price: z.number().optional(),
  price_after_discount: z.number().optional(),
  quantity: z.number().optional(),
  returned_quantity: z.number().optional(),
  processing_fee: z.number().optional(),
  cogs: z.number().optional(),
  product_cost: z.string().optional(),
  product_cost_amount: z.number().optional(),
});

export const orderAddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
});

export const orderFeeSchema = z.object({
  admin_fee: z.number().optional().default(0),
  processing_fee: z.number().optional().default(0),
  affiliate_fee: z.number().optional().default(0),
  service_fee: z.number().optional().default(0),
  shipping_saver_program_fee: z
    .number()
    .optional()
    .default(0),
  transaction_fee: z.number().optional().default(0),
  campaign_fee: z.number().optional().default(0),
  auto_top_up_fee_from_income: z
    .number()
    .optional()
    .default(0),
  return_shipping_fee: z.number().optional().default(0),
  return_to_sender_shipping_fee: z
    .number()
    .optional()
    .default(0),
  shipping_fee_refund: z.number().optional().default(0),
});

export const formSchema = z.object({
  id: z.string().optional(),
  order_id: z.string().min(1, 'Order ID wajib diisi'),
  platform: z.enum([
    'shopee',
    'tokopedia',
    'tiktok-shop',
    'lazada',
    'blibli',
  ]),
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
  free_shipping_from_shopee: z.number().optional(),
  shipping_fee_paid_by_buyer: z.number().optional(),
  shipping_fee_discount_by_logistics: z.number().optional(),
  shipping_fee_forwarded_by_shopee: z.number().optional(),
  estimated_shipping_fee_discount: z.number().optional(),
  product_weight: z.number().optional(),
  total_weight: z.number().optional(),
  receiver_name: z.string().optional(),
  phone_number: z.string().optional(),
  address: orderAddressSchema.optional(),
  fee: orderFeeSchema.optional(),
  buyer_note: z.string().optional(),
  note: z.string().optional(),
  items: z.array(orderItemSchema).optional(),
  free_shipping_promo_from_seller: z.number().optional(),
  compensation: z.number().optional(),
  released_amount: z.number().optional(),
  net_amount: z.number().optional(),
  shipping_arranged_at: z.string().optional(),
  order_created_at: z.string().optional(),
  order_released_at: z.string().optional(),
  order_completed_at: z.string().optional(),
});
