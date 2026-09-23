import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import {
  FINANCE_INVENTORY_ITEM_TYPE_VALUES,
  type FinanceInventoryItemType,
} from './finance-inventory.constants';

export type TFinanceInventoryItem = Document & {
  organization: Types.ObjectId;
  sku: string;
  name: string;
  item_type: FinanceInventoryItemType;
  unit: string;
  track_quantity: boolean;
  track_value: boolean;
  inventory_account?: Types.ObjectId;
  cogs_account?: Types.ObjectId;
  reorder_point?: number;
  is_active: boolean;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
};

const FinanceInventoryItemSchema =
  new Schema<TFinanceInventoryItem>(
    {
      organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        select: false,
      },
      sku: { type: String, required: true, trim: true },
      name: { type: String, required: true, trim: true },
      item_type: {
        type: String,
        enum: FINANCE_INVENTORY_ITEM_TYPE_VALUES,
        required: true,
      },
      unit: { type: String, required: true, trim: true },
      track_quantity: { type: Boolean, default: true },
      track_value: { type: Boolean, default: true },
      inventory_account: { type: Schema.Types.ObjectId },
      cogs_account: { type: Schema.Types.ObjectId },
      reorder_point: { type: Number, min: 0 },
      is_active: { type: Boolean, default: true },
      description: { type: String },
    },
    {
      timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    }
  );

FinanceInventoryItemSchema.index(
  { organization: 1, sku: 1 },
  { unique: true }
);
FinanceInventoryItemSchema.plugin(multiTenancyPlugin);

export const FinanceInventoryItemModel =
  models.FinanceInventoryItem ||
  model<TFinanceInventoryItem>(
    'FinanceInventoryItem',
    FinanceInventoryItemSchema,
    'finance_inventory_items'
  );
