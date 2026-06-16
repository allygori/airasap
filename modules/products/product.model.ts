import {
  Schema,
  model,
  models,
  Document,
  Types,
} from 'mongoose';
import { ProductBaseDTO } from './product.dto';
import { PLATFORMS } from '../constant';
import { Data } from '@dnd-kit/core';

const ObjectId = Schema.Types.ObjectId;

const platforms = [...PLATFORMS] as const;

export type TProduct = Document &
  ProductBaseDTO & {
    organization: Types.ObjectId;
    store: Types.ObjectId;
    deleted_at?: Date | null;
    created_at?: Date;
    updated_at?: Data;
  };

// export type TVariant = {
//   variant_id: string;
//   name: string;
//   key: string;
//   price: number;
//   quantity: number;
//   discount: number;
//   finalPrice: number;
//   SKU?: string;
//   GTIN?: string;
// };

// export type TProduct = Document & {
//   organization: typeof ObjectId;
//   store: typeof ObjectId;
//   platform: (typeof platforms)[number];
//   name: string;
//   product_id: string;
//   key: string;
//   variants?: TVariant[];
//   is_active: boolean;
//   deleted_at: Date;
// };

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
      alias: 'storeId',
    },
    platform: {
      type: String,
      enum: PLATFORMS,
      required: true,
    },
    name: { type: String, required: true },
    key: { type: String },
    product_id: {
      type: String,
      required: true,
      unique: true,
    },
    variants: [
      {
        variant_id: { type: String, unique: true }, // variation id
        name: { type: String, required: true },
        key: { type: String }, // product_id::variation name
        price: { type: Number, required: true },
        // quantity: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        final_price: { type: Number },
        parent_sku: { type: String, required: false },
        sku: { type: String, required: false },
        gtin: { type: String, required: false },
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
