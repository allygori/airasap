import {
  Schema,
  model,
  models,
  Document,
  Types,
} from 'mongoose';
import { ProductBaseDTO } from './product.dto';
import { PLATFORMS } from '../constant';

export type TProduct = Document &
  ProductBaseDTO & {
    organization: Types.ObjectId;
    store: Types.ObjectId;
    deleted_at?: Date | null;
    created_at?: Date;
    updated_at?: Date;
  };

const ProductSchema = new Schema<TProduct>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      select: false,
      alias: 'organizationId',
    },
    store: {
      type: Schema.Types.ObjectId,
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
    name: { type: String, required: true },
    // key: { type: String },
    product_id: {
      type: String,
      required: true,
      unique: true,
    },
    options: {
      type: [[String]],
      required: false,
    },
    variants: [
      {
        variant_id: { type: String, unique: true }, // variation id
        name: { type: String, required: true },
        // key: { type: String }, // product_id::variation name
        price: { type: Number, required: true },
        // quantity: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        final_price: { type: Number },
        parent_sku: { type: String, required: false },
        sku: { type: String, required: false },
        gtin: { type: String, required: false },
        is_default: {
          type: Boolean,
          required: true,
          default: true,
        },
        default_cost: { type: Number, required: false },
        costs: [
          {
            // apakah perlu flag mana harga yang saat ini sedang aktif?
            // apakah `effective_from` tetap diperlukan?
            // effective_from: {
            //   type: Date,
            //   alias: 'effectiveFrom',
            // },
            cogs_unit: {
              type: Number,
              unique: true, // unique price
              // default: 0,
            },
            notes: {
              type: String,
            },
          },
        ],
        // product: {
        //   type: Types.ObjectId,
        //   ref: 'Product',
        //   required: false,
        // },
        // product_cost: {
        //   type: Types.ObjectId,
        //   ref: 'ProductCost',
        //   required: false,
        // },
      },
    ],
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
    organization: 1,
    store: 1,
    product_id: 1,
  },
  { unique: true }
);

ProductSchema.index({
  organization: 1,
  store: 1,
  platform: 1,
});

export const ProductModel =
  models.Product ||
  model<TProduct>('Product', ProductSchema, 'products');
