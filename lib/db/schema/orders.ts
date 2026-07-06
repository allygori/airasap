import { Schema, model, models } from 'mongoose';
import { PLATFORMS } from '../constant';

const OrderSchema = new Schema(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    platform: {
      type: String,
      enum: PLATFORMS,
      required: true,
    },

    // Order ID & statuses
    order_id: { type: String, alias: 'orderId' },
    status: { type: String },
    cancellation_return_status: {
      type: String,
      alias: 'cancellationReturnStatus',
    },

    username: { type: String },
    number_of_products_ordered: {
      type: Number,
      alias: 'numberOfProductsOrdered',
    },

    // Payment
    total_payment: { type: Number, alias: 'totalPayment' }, // buyer payment amount
    payment_method: {
      type: String,
      alias: 'paymentMethod',
    },
    paid_at: { type: Date, alias: 'paidAt' },
    order_subtotal: {
      type: Number,
      alias: 'orderSubtotal',
    },

    // Discounts and Cashback
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
    coin_cashback: { type: Number, alias: 'coinCashback' },
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

    // Shipping
    // shipped_by_advance_fulfillment: { type: Boolean, default: false },
    // tracking_number: { type: String },
    // drop_off_or_counter_pick_up: { type: String },
    // order_must_be_shipped_before: { type: Date },
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
      alias: 'shippingCostPaidByBuyer',
    },
    estimated_shipping_fee_discount: {
      type: Number,
      alias: 'estimatedShippingFeeDiscount',
    },
    product_weight: {
      type: Number,
      alias: 'productWeight',
    }, // unit: gram
    total_weight: { type: Number, alias: 'totalWeight' }, // unit: gram
    receiver_name: { type: String, alias: 'receiverName' },
    phone_number: { type: String, alias: 'phoneNumber' },
    address: {
      street: { type: String },
      city: { type: String },
      province: { type: String },
    },
    buyer_note: { type: String, alias: 'buyerNote' },
    note: { type: String },

    // /** @todo Need fixation */
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        parent_sku: { type: String, alias: 'parentSku' },
        sku_reference_number: {
          type: String,
          alias: 'skuReferenceNumber',
        },
        product_name: {
          type: String,
          alias: 'productName',
        },
        variation_name: {
          type: String,
          alias: 'variationName',
        },
        product_key: { type: String, alias: 'productKey' },
        original_price: {
          type: Number,
          alias: 'originalPrice',
        },
        price_after_discount: {
          type: Number,
          alias: 'priceAfterDiscount',
        },
        quantity: { type: Number },
        returned_quantity: {
          type: Number,
          alias: 'returnedQuantity',
        },

        // unit_price: { type: Number },
        // gross_amount: { type: Number },
        cogs: { type: Number }, // snapshot of cogs
      },
    ],

    // Fees
    admin_fee: { type: Number, alias: 'adminFee' }, // Biaya Administrasi (mandatory)
    order_process_fee: {
      type: Number,
      alias: 'orderProcessFee',
    }, // Biaya Proses Pesanan (mandatory)
    // service_fee: { type: Number }, // Biaya Layanan
    affiliate_fee: { type: Number, alias: 'affiliateFee' }, // Biaya AMS (Affiliate fee)
    campaign_fee: { type: Number, alias: 'campaignFee' }, // Biaya kampanye
    voucher_fee: { type: Number, alias: 'voucherFee' }, // Voucher
    shipping_fee: { type: Number, alias: 'shippingFee' },
    other_fee: { type: Number, alias: 'otherFee' },

    // Return
    return_shipping_fee: {
      type: Number,
      alias: 'returnShippingFee',
    },

    // Released
    released_amount: {
      type: Number,
      alias: 'releasedAmount',
    },
    net_amount: { type: Number, alias: 'netAmount' },

    // Timestamps
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

    // Custom fields
    deleted_at: { type: Date, alias: 'deletedAt' }, // soft delete
  },
  {
    timestamps: {
      createdAt: 'created_at', // Use `created_at` to store the created date
      updatedAt: 'updated_at', // and `updated_at` to store the last updated date
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

// { organization_id: 1, store_id: 1 }
// { organization_id: 1, store_id: 1, order_created_at: -1 }
// { organization_id: 1, store_id: 1, order_id: 1 }
// unique

const Order =
  models.Order || model('Order', OrderSchema, 'Orders');

export default Order;
