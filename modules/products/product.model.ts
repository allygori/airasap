import { Schema, model, models, Document } from 'mongoose';
import { PLATFORMS } from '../constant';

const ObjectId = Schema.Types.ObjectId;

const platforms = [...PLATFORMS] as const;

export type TVariant = {
  variant_id: string;
  name: string;
  product_key: string;
  price: number;
  quantity: number;
  discount: number;
  finalPrice: number;
  SKU?: string;
  GTIN?: string;
};

export type TProduct = Document & {
  organization: typeof ObjectId;
  store: typeof ObjectId;
  platform: (typeof platforms)[number];
  name: string;
  product_id: string;
  key: string;
  variants?: TVariant[];
  is_active: boolean;
  deleted_at: Date;
};

const ProductSchema = new Schema<TProduct>(
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
    key: { type: String },
    product_id: { type: String, unique: true },
    variants: [
      {
        variant_id: { type: Number, unique: true }, // variation id
        name: { type: String, required: true },
        key: { type: String }, // product_id::variation name
        price: { type: Number, required: true },
        quantity: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        finalPrice: { type: Number },
        SKU: { type: String, required: false },
        GTIN: { type: String, required: false },
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

export const ProductModel =
  models.Product ||
  model<TProduct>('Product', ProductSchema, 'products');
