import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import { InventoryItemMappingBaseDTO } from './inventory-item-mapping.dto';

export type TInventoryItemMapping = Document &
  Omit<
    InventoryItemMappingBaseDTO,
    'product' | 'inventory_item'
  > & {
    organization: Types.ObjectId;
    product: Types.ObjectId;
    inventory_item: Types.ObjectId;
    variant_key: string;
    created_at?: Date;
    updated_at?: Date;
  };

const InventoryItemMappingSchema =
  new Schema<TInventoryItemMapping>(
    {
      organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        select: false,
      },
      product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      variant_id: { type: String, trim: true },
      variant_key: {
        type: String,
        required: true,
        trim: true,
      },
      inventory_item: {
        type: Schema.Types.ObjectId,
        ref: 'InventoryItem',
        required: true,
      },
      mapping_method: {
        type: String,
        enum: [
          'manual',
          'sku',
          'product_match',
          'imported',
        ],
        required: true,
        default: 'manual',
      },
      is_active: { type: Boolean, default: true },
      notes: { type: String, trim: true },
    },
    {
      timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    }
  );

InventoryItemMappingSchema.index(
  { organization: 1, product: 1, variant_key: 1 },
  {
    unique: true,
    partialFilterExpression: { is_active: true },
  }
);
InventoryItemMappingSchema.index({
  organization: 1,
  inventory_item: 1,
  is_active: 1,
});
InventoryItemMappingSchema.plugin(multiTenancyPlugin);

export const InventoryItemMappingModel =
  models.InventoryItemMapping ||
  model<TInventoryItemMapping>(
    'InventoryItemMapping',
    InventoryItemMappingSchema,
    'inventory_item_mappings'
  );
