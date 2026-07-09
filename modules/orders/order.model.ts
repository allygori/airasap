import {
  Schema,
  model,
  models,
  Document,
  Types,
} from 'mongoose';
import { ORDER_PLATFORM_VALUES } from '@/constant/order-platform';
import { SHOPEE_ORDER_STATUS_VALUES } from '@/constant/order/shopee/status';
import {
  OrderItemDTO,
  OrderAddressDTO,
  OrderFeeDTO,
  OrderBaseDTO,
} from './order.dto';

export type TOrderItem = OrderItemDTO;
export type TOrderAddress = OrderAddressDTO;
export type TOrderFee = OrderFeeDTO;

export type TOrder = Document &
  OrderBaseDTO & {
    organization: Types.ObjectId;
    store: Types.ObjectId;
    deleted_at?: Date | null;
    created_at?: Date;
    updated_at?: Date;
  };

const ORDER_STATUSES = SHOPEE_ORDER_STATUS_VALUES;

const OrderItemSchema = new Schema<TOrderItem>(
  {
    product: {
      type: Types.ObjectId,
      ref: 'Product',
      required: false, // Not required because there are possibility user rename product name and can't find and match product by name, solution is user select the right product
      alias: 'productId',
    },
    product_cost: {
      type: Number,
      default: 0,
      required: false,
    },
    profit: {
      type: Number,
      default: 0,
      required: false,
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
    // product_key: {
    //   type: String,
    //   alias: 'productKey',
    // },
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
    discount: {
      type: Number,
      default: 0,
    },
    price_after_discount: {
      type: Number,
      alias: 'priceAfterDiscount',
    },
    quantity: {
      type: Number,
    },
    subtotal: {
      type: Number,
      alias: 'orderSubtotal',
    },
    returned_quantity: {
      type: Number,
      alias: 'returnedQuantity',
    },
    // cogs: {
    //   // replaced with product_cost_amount
    //   type: Number,
    // },
    // product_cost: {
    //   type: Types.ObjectId,
    //   ref: 'ProductCost',
    //   required: false,
    // },
    // product_cost_amount: {
    //   type: Number,
    //   required: false,
    // },
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
      default: 0,
      alias: 'adminFee',
    },
    processing_fee: {
      type: Number,
      required: false,
      default: 0,
      alias: 'processingFee',
    },
    affiliate_fee: {
      type: Number,
      required: false,
      default: 0,
      alias: 'affiliateFee',
    }, // shopee: AMS program, tokped: ?
    service_fee: {
      type: Number,
      required: false,
      default: 0,
      alias: 'serviceFee',
    },
    shipping_saver_program_fee: {
      type: Number,
      required: false,
      default: 0,
      alias: 'shippingSaverProgramFee',
    }, // shopee: gratis ongkir xtra/xtra+ program
    transaction_fee: {
      type: Number,
      required: false,
      default: 0,
      alias: 'transactionFee',
    },
    campaign_fee: {
      type: Number,
      required: false,
      default: 0,
      alias: 'campaignFee',
    },
    auto_top_up_fee_from_income: {
      type: Number,
      required: false,
      default: 0,
      alias: 'autoTopUpFeeFromIncome',
    },

    // return
    return_shipping_fee: {
      type: Number,
      required: false,
      default: 0,
      alias: 'returnShippingFee',
    },
    return_to_sender_shipping_fee: {
      type: Number,
      required: false,
      default: 0,
      alias: 'returnToSenderShippingFee',
    },
    // over charge shipping fee refund
    shipping_fee_refund: {
      type: Number,
      required: false,
      default: 0,
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
      enum: ORDER_PLATFORM_VALUES,
      required: true,
    },
    order_id: {
      type: String,
      alias: 'orderId',
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
    },
    cancelled_by: {
      type: String,
      enum: ['buyer', 'seller', 'system', 'unknown', null],
      default: null,
    },
    cancellation_reason: {
      type: String,
      alias: 'cancellationReason',
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
    voucher_code: {
      type: String,
      required: false,
      default: null,
      alias: 'voucherCode',
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
    estimated_shipping_cost: {
      type: Number,
      alias: 'estimatedShippingCost',
    },
    shipping_cost_paid_by_buyer: {
      type: Number,
      alias: 'shippingCostPaidByBuyer',
    },
    shipping_cost_discount_by_logistics: {
      type: Number,
      required: false,
      alias: 'shippingCostDiscountByLogistics',
      default: 0,
    },
    shipping_cost_forwarded_by_shopee: {
      type: Number,
      required: false,
      alias: 'shippingCostForwardedByShopee',
      default: 0,
    },
    free_shipping_from_shopee: {
      type: Number,
      required: false,
      alias: 'freeShippingFromShopee',
    },
    estimated_shipping_cost_discount: {
      type: Number,
      alias: 'estimatedShippingCostDiscount',
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

    // Date related data
    placed_at: {
      type: Date,
      alias: 'orderCreationTime',
    },
    shipping_arranged_at: {
      type: Date,
      alias: 'shippingArrangedAt',
    },
    paid_at: {
      type: Date,
      alias: 'paidAt',
    },
    released_funds_at: {
      type: Date,
      alias: 'releasedFundDate',
    },
    completed_at: {
      type: Date,
      alias: 'orderCompletionTime',
    },

    // additional fields
    total_product_cost: {
      type: Number,
      default: 0,
    },
    total_profit: {
      type: Number,
      default: 0,
    },
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
  placed_at: -1,
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
