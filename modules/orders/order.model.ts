import {
  Schema,
  model,
  models,
  Document,
  Types,
} from 'mongoose';
import { PLATFORMS } from '../constant';
import {
  OrderItemDTO,
  OrderAddressDTO,
  OrderFeeDTO,
  OrderBaseDTO,
} from './order.dto';

// const platforms = [...PLATFORMS] as const;

// export type TOrderItem = {
//   product: typeof ObjectId;
//   parent_sku?: string;
//   sku_reference_number?: string;
//   product_name?: string;
//   variation_name?: string;
//   product_key?: string;
//   original_price?: number;
//   price_after_discount?: number;
//   quantity?: number;
//   returned_quantity?: number;
//   cogs?: number;
// };

export type TOrderItem = OrderItemDTO;
export type TOrderAddress = OrderAddressDTO;
export type TOrderFee = OrderFeeDTO;

// export type TOrder = Document & {
//   organization: typeof ObjectId;
//   store: typeof ObjectId;
//   platform: (typeof platforms)[number];
//   order_id?: string;
//   status?: string;
//   cancellation_return_status?: string;
//   username?: string;
//   number_of_products_ordered?: number;
//   total_payment?: number;
//   payment_method?: string;
//   paid_at?: Date;
//   order_subtotal?: number;
//   total_discount?: number;
//   discount_from_seller?: number;
//   discount_from_shopee?: number;
//   voucher_borne_by_seller?: number;
//   voucher_borne_by_shopee?: number;
//   coin_cashback?: number;
//   bundle_deal?: boolean;
//   bundle_deal_discount_from_shopee?: number;
//   bundle_deal_discount_from_seller?: number;
//   shopee_coin_offset?: number;
//   credit_card_discount?: number;
//   shipping_option?: string;
//   estimated_shipping_fee?: number;
//   shipping_fee_paid_by_buyer?: number;
//   estimated_shipping_fee_discount?: number;
//   product_weight?: number;
//   total_weight?: number;
//   receiver_name?: string;
//   phone_number?: string;
//   address?: TOrderAddress;
//   buyer_note?: string;
//   note?: string;
//   items?: TOrderItem[];
//   admin_fee?: number;
//   order_process_fee?: number;
//   affiliate_fee?: number;
//   campaign_fee?: number;
//   voucher_fee?: number;
//   shipping_fee?: number;
//   other_fee?: number;
//   return_shipping_fee?: number;
//   released_amount?: number;
//   net_amount?: number;
//   shipping_arranged_at?: Date;
//   order_created_at?: Date;
//   order_released_at?: Date;
//   order_completed_at?: Date;
//   deleted_at?: Date;
// };

export type TOrder = Document &
  OrderBaseDTO & {
    organization: Types.ObjectId;
    store: Types.ObjectId;
    deleted_at?: Date | null;
    created_at?: Date;
    updated_at?: Date;
  };

const OrderItemSchema = new Schema<TOrderItem>(
  {
    product: {
      type: Types.ObjectId,
      ref: 'Product',
      required: false, // Not required because there are possibility user rename product name and can't find and match product by name, solution is user select the right product
      alias: 'productId',
    },

    product_name: {
      type: String,
      alias: 'productName',
    },
    // variation_id: {
    //   type: String,
    //   alias: 'variationId',
    // },
    variation_name: {
      type: String,
      alias: 'variationName',
    },
    product_key: {
      type: String,
      alias: 'productKey',
    },
    parent_sku: {
      type: String,
      alias: 'parentSku',
    },
    sku_reference_number: {
      type: String,
      alias: 'skuReferenceNumber',
    },
    original_price: {
      type: Number,
      alias: 'originalPrice',
    },
    price_after_discount: {
      type: Number,
      alias: 'priceAfterDiscount',
    },
    quantity: {
      type: Number,
    },
    returned_quantity: {
      type: Number,
      alias: 'returnedQuantity',
    },
    cogs: {
      // replaced with product_cost_amount
      type: Number,
    },
    product_cost: {
      type: Types.ObjectId,
      ref: 'ProductCost',
      required: false,
    },
    product_cost_amount: {
      type: Number,
      required: false,
    },
  },
  { _id: false }
);

const OrderAddressSchema = new Schema<TOrderAddress>(
  {
    street: {
      type: String,
    },
    city: {
      type: String,
    },
    province: {
      type: String,
    },
  },
  { _id: false }
);

const OrderFeeSchema = new Schema<TOrderFee>(
  {
    admin_fee: {
      type: Number,
      required: false,
      alias: 'adminFee',
    },
    processing_fee: {
      type: Number,
      required: false,
      alias: 'processingFee',
    },
    affiliate_fee: {
      type: Number,
      required: false,
      alias: 'affiliateFee',
    }, // shopee: AMS program, tokped: ?
    service_fee: {
      type: Number,
      required: false,
      alias: 'serviceFee',
    },
    shipping_saver_program_fee: {
      type: Number,
      required: false,
      alias: 'shippingSaverProgramFee',
    }, // shopee: gratis ongkir xtra/xtra+ program
    transaction_fee: {
      type: Number,
      required: false,
      alias: 'transactionFee',
    },
    campaign_fee: {
      type: Number,
      required: false,
      alias: 'campaignFee',
    },
    auto_top_up_fee_from_income: {
      type: Number,
      required: false,
      alias: 'autoTopUpFeeFromIncome',
    },

    // return
    return_shipping_fee: {
      type: Number,
      required: false,
      alias: 'returnShippingFee',
      default: 0,
    },
    return_to_sender_shipping_fee: {
      type: Number,
      required: false,
      alias: 'returnToSenderShippingFee',
    },
    // over charge shipping fee refund
    shipping_fee_refund: {
      type: Number,
      required: false,
      alias: 'shippingFeeRefund',
    },
  },
  { _id: false }
);

const OrderSchema = new Schema<TOrder>(
  {
    organization: {
      type: Types.ObjectId,
      ref: 'Organization',
      required: true,
      select: false,
      alias: 'organizationId',
    },
    store: {
      type: Types.ObjectId,
      ref: 'Store',
      required: true,
      select: false,
      alias: 'storeId',
    },
    platform: {
      type: String,
      enum: PLATFORMS,
      required: true,
    },
    order_id: {
      type: String,
      alias: 'orderId',
    },
    status: {
      type: String,
    },
    cancellation_return_status: {
      type: String,
      alias: 'cancellationReturnStatus',
    },
    username: {
      type: String,
    },
    number_of_products_ordered: {
      type: Number,
      alias: 'numberOfProductsOrdered',
    },
    total_payment: {
      type: Number,
      alias: 'totalPayment',
    },
    payment_method: {
      type: String,
      alias: 'paymentMethod',
    },
    paid_at: {
      type: Date,
      alias: 'paidAt',
    },
    order_subtotal: {
      type: Number,
      alias: 'orderSubtotal',
    },
    total_discount: {
      type: Number,
      alias: 'totalDiscount',
    },
    discount_from_seller: {
      type: Number,
      alias: 'discountFromSeller',
    },
    discount_from_shopee: {
      type: Number,
      alias: 'discountFromShopee',
    },
    voucher_borne_by_seller: {
      type: Number,
      alias: 'voucherBorneBySeller',
    },
    voucher_borne_by_shopee: {
      type: Number,
      alias: 'voucherBorneByShopee',
    },
    coin_cashback: {
      type: Number,
      alias: 'coinCashback',
    },
    bundle_deal: {
      type: Boolean,
      default: false,
      alias: 'bundleDeal',
    },
    bundle_deal_discount_from_shopee: {
      type: Number,
      alias: 'bundleDealDiscountFromShopee',
    },
    bundle_deal_discount_from_seller: {
      type: Number,
      alias: 'bundleDealDiscountFromSeller',
    },
    shopee_coin_offset: {
      type: Number,
      alias: 'shopeeCoinOffset',
    },
    credit_card_discount: {
      type: Number,
      alias: 'creditCardDiscount',
    },
    shipping_option: {
      type: String,
      alias: 'shippingOption',
    },
    estimated_shipping_fee: {
      type: Number,
      alias: 'estimatedShippingFee',
    },
    shipping_fee_paid_by_buyer: {
      type: Number,
      alias: 'shippingFeePaidByBuyer',
    },
    shipping_fee_discount_by_logistics: {
      type: Number,
      required: false,
      alias: 'shippingFeeDiscountByLogistics',
      default: 0,
    },
    shipping_fee_forwarded_by_shopee: {
      type: Number,
      required: false,
      alias: 'shippingFeeForwardedByShopee',
      default: 0,
    },
    free_shipping_from_shopee: {
      type: Number,
      required: false,
      alias: 'freeShippingFromShopee',
    },
    estimated_shipping_fee_discount: {
      type: Number,
      alias: 'estimatedShippingFeeDiscount',
    },
    free_shipping_promo_from_seller: {
      type: Number,
      alias: 'freeShippingPromoFromSeller',
      default: 0,
    },
    compensation: {
      type: Number,
      alias: 'freeShippingPromoFromSeller',
      default: 0,
    },
    product_weight: {
      type: Number,
      alias: 'productWeight',
    },
    total_weight: {
      type: Number,
      alias: 'totalWeight',
    },
    receiver_name: {
      type: String,
      alias: 'receiverName',
    },
    phone_number: {
      type: String,
      alias: 'phoneNumber',
    },
    address: {
      type: OrderAddressSchema,
    },
    buyer_note: {
      type: String,
      alias: 'buyerNote',
    },
    note: {
      type: String,
    },
    items: {
      type: [OrderItemSchema],
    },
    fee: {
      type: OrderFeeSchema,
    },
    // admin_fee: {
    //   type: Number,
    //   alias: 'adminFee',
    // },
    // processing_fee: {
    //   type: Number,
    //   alias: 'orderProcessFee',
    // },
    // affiliate_fee: {
    //   type: Number,
    //   alias: 'affiliateFee',
    // },
    // campaign_fee: {
    //   type: Number,
    //   alias: 'campaignFee',
    // },
    // voucher_fee: {
    //   type: Number,
    //   alias: 'voucherFee',
    // },
    // shipping_fee: {
    //   type: Number,
    //   alias: 'shippingFee',
    // },
    // other_fee: {
    //   type: Number,
    //   alias: 'otherFee',
    // },
    // return_shipping_fee: {
    //   type: Number,
    //   alias: 'returnShippingFee',
    // },
    released_amount: {
      type: Number,
      alias: 'releasedAmount',
      default: 0,
    },
    net_amount: {
      type: Number,
      alias: 'netAmount',
    },
    shipping_arranged_at: {
      type: Date,
      alias: 'shippingArrangedAt',
    },
    order_created_at: {
      type: Date,
      alias: 'orderCreatedAt',
    },
    order_released_at: {
      type: Date,
      alias: 'orderReleasedAt',
    },
    order_completed_at: {
      type: Date,
      alias: 'orderCompletedAt',
    },

    // additional fields
    enriched_at: {
      type: Date,
      alias: 'enrichedAt',
      default: null,
    },
    /**
     * @TODO implement
     */
    // enrichments: [
    //   {

    //   }
    // ],
    deleted_at: {
      type: Date,
      alias: 'deletedAt',
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

OrderSchema.index({
  organization: 1,
  store: 1,
});

OrderSchema.index({
  organization: 1,
  store: 1,
  order_created_at: -1,
});

OrderSchema.index(
  {
    organization: 1,
    store: 1,
    order_id: 1,
  },
  { unique: true }
);

export const OrderModel =
  models.Order ||
  model<TOrder>('Order', OrderSchema, 'orders');
