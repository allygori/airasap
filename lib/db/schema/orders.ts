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
    order_id: { type: String },
    status: { type: String },
    // shipped_by_advance_fulfillment: { type: Boolean, default: false },
    // cancellation_return_status: { type: String },
    // tracking_number: { type: String },
    shipping_option: { type: String },
    // drop_off_or_counter_pick_up: { type: String },
    // order_must_be_shipped_before: { type: Date },
    paid_at: { type: Date },
    payment_method: { type: String },
    username: { type: String },
    // payment_amount: { type: Number }, // buyer payment amount
    receiver_name: { type: String },
    phone_number: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      province: { type: String },
    },

    // Timestamps
    shipping_time_arranged_at: { type: Date },
    order_created_at: { type: Date },
    order_released_at: { type: Date },
    order_completed_at: { type: Date },

    // /** @todo Need fixation */
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        parent_sku: { type: String },
        sku_reference_number: { type: String },
        product_name: { type: String },
        variation_name: { type: String },
        product_key: { type: String },
        original_price: { type: Number },
        price_after_discount: { type: Number },
        quantity: { type: Number },
        returned_quantity: { type: Number },
        order_subtotal: { type: Number },
        total_discount: { type: Number },
        discount_from_seller: { type: Number },
        discount_from_shopee: { type: Number },
        product_weight: { type: Number }, // unit: gram
        number_of_products_ordered: { type: Number },
        total_weight: { type: Number }, // unit: gram
        voucher_borne_by_seller: { type: Number },
        voucher_borne_by_shopee: { type: Number },
        coin_cashback: { type: Number },
        bundle_deal: { type: Boolean, default: false },
        bundle_deal_discount_from_shopee: { type: Number },
        bundle_deal_discount_from_seller: { type: Number },
        shopee_coin_offset: { type: Number },
        credit_card_discount: { type: Number },
        shipping_fee_paid_by_buyer: { type: Number },
        estimated_shipping_fee_discount: { type: Number },
        return_shipping_fee: { type: Number },
        total_payment: { type: Number },
        estimated_shipping_fee: { type: Number },
        buyer_note: { type: String },
        note: { type: String },

        // unit_price: { type: Number },
        // gross_amount: { type: Number },
        cogs_snapshot: { type: Number },
      },
    ],
    // total_quantity: Number, // number of products or items
    // total_gross_amount: Number,

    // settlement: {
    //   release_date,
    //   admin_fee,
    //   affiliate_fee,
    //   voucher_fee,
    //   net_amount
    // },

    gross_amount: { type: Number },

    admin_fee: { type: Number }, // Biaya Administrasi (mandatory)
    order_process_fee: { type: Number }, // Biaya Proses Pesanan (mandatory)
    // service_fee: { type: Number }, // Biaya Layanan
    affiliate_fee: { type: Number }, // Biaya AMS (Affiliate fee)
    campaign_fee: { type: Number }, // Biaya kampanye
    voucher_fee: { type: Number }, // Voucher

    shipping_fee: { type: Number },
    other_fee: { type: Number },

    // Return
    return_shipping_fee: { type: Number },

    released_amount: { type: Number },
    net_amount: { type: Number },

    // Custom fields
    deleted_at: { type: Date }, // soft delete
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
