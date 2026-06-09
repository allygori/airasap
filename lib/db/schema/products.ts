import { Schema, model, models } from 'mongoose';
import { PLATFORMS } from '../constant';

const ProductSchema = new Schema(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      alias: 'organizationId',
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
    name: { type: String, required: true },
    product_key: { type: String }, // product_id::variation_name
    product_id: { type: String },
    // shopee: {
    //   // product_key: { type: String }, // product_id::variation_name
    // },
    variants: [
      {
        name: { type: String, required: true },
        product_key: { type: String }, // product_id::variation name
        price: { type: Number, required: true },
        quantity: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        finalPrice: { type: Number },
        SKU: { type: String, required: false },
        GTIN: { type: String, required: false },
      },
    ],
    // variation_name: { type: String },
    is_active: { type: Boolean, default: true },

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

ProductSchema.index({
  organization: 1,
  store: 1,
});

ProductSchema.index(
  {
    organization_id: 1,
    store_id: 1,
    product_key: 1,
  },
  { unique: true }
);

ProductSchema.index({
  organization_id: 1,
  store_id: 1,
  'shopee.product_id': 1,
});

// { organization_id: 1, store_id: 1 }
// { organization_id: 1, store_id: 1, product_key: 1 }
// unique
// { organization_id: 1, store_id: 1, platform_product_id: 1 }

const Product =
  models.Product ||
  model('Product', ProductSchema, 'Products');

export default Product;
