import { Schema, model, models } from 'mongoose';
import { PLATFORMS } from '../constant';

const ProductCostSchema = new Schema(
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
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    effective_from: { type: Date },
    cogs: { type: Number },
    notes: { type: String },

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

ProductCostSchema.index({
  product_id: 1,
  effective_from: -1,
});

ProductCostSchema.index({
  organization: 1,
  store: 1,
});

// { product_id: 1, effective_from: -1 }
// { organization_id: 1, store_id: 1 }

const ProductCost =
  models.ProductCost ||
  model('ProductCost', ProductCostSchema, 'ProductCosts');

export default ProductCost;
