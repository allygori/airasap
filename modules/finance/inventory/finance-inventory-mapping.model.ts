import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';

export type TFinanceInventoryMapping = Document & {
  organization: Types.ObjectId;
  product: Types.ObjectId;
  variant_id?: string;
  variant_key: string;
  inventory_item: Types.ObjectId;
  mapping_method: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
};

const FinanceInventoryMappingSchema =
  new Schema<TFinanceInventoryMapping>(
    {
      organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        select: false,
      },
      product: {
        type: Schema.Types.ObjectId,
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
        required: true,
      },
      mapping_method: { type: String, required: true },
      is_active: { type: Boolean, default: true },
    },
    {
      timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    }
  );

FinanceInventoryMappingSchema.index({
  organization: 1,
  inventory_item: 1,
  is_active: 1,
});
FinanceInventoryMappingSchema.plugin(multiTenancyPlugin);

export const FinanceInventoryMappingModel =
  models.FinanceInventoryMapping ||
  model<TFinanceInventoryMapping>(
    'FinanceInventoryMapping',
    FinanceInventoryMappingSchema,
    'finance_inventory_item_mappings'
  );
