import { Schema, model, models, Document } from 'mongoose';

const ObjectId = Schema.Types.ObjectId;

export type TProductCost = Document & {
  organization: typeof ObjectId;
  store: typeof ObjectId;
  product: typeof ObjectId;
  effective_from?: Date;
  cogs?: number;
  notes?: string;
  deleted_at?: Date;
};

const ProductCostSchema = new Schema<TProductCost>(
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
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      alias: 'productId',
    },
    effective_from: {
      type: Date,
      alias: 'effectiveFrom',
    },
    cogs: {
      type: Number,
    },
    notes: {
      type: String,
    },
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

ProductCostSchema.index({
  product: 1,
  effective_from: -1,
});

ProductCostSchema.index({
  organization: 1,
  store: 1,
});

export const ProductCostModel =
  models.ProductCost ||
  model<TProductCost>(
    'ProductCost',
    ProductCostSchema,
    'ProductCosts'
  );
