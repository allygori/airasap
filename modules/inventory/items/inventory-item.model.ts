import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import { InventoryItemBaseDTO } from './inventory-item.dto';

export type TInventoryItem = Document &
  Omit<
    InventoryItemBaseDTO,
    'inventory_account' | 'cogs_account'
  > & {
    organization: Types.ObjectId;
    inventory_account?: Types.ObjectId;
    cogs_account?: Types.ObjectId;
    created_at?: Date;
    updated_at?: Date;
  };

const InventoryItemSchema = new Schema<TInventoryItem>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      select: false,
    },
    sku: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    item_type: { type: String, required: true },
    unit: { type: String, required: true, trim: true },
    track_quantity: { type: Boolean, default: true },
    track_value: { type: Boolean, default: true },
    inventory_account: {
      type: Schema.Types.ObjectId,
      ref: 'AccountingAccount',
    },
    cogs_account: {
      type: Schema.Types.ObjectId,
      ref: 'AccountingAccount',
    },
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

InventoryItemSchema.index(
  { organization: 1, sku: 1 },
  { unique: true }
);
InventoryItemSchema.plugin(multiTenancyPlugin);

export const InventoryItemModel =
  models.InventoryItem ||
  model<TInventoryItem>(
    'InventoryItem',
    InventoryItemSchema,
    'inventory_items'
  );
