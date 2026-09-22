import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';

export const FINANCE_INVENTORY_LOCATION_TYPE_VALUES = [
  'warehouse',
  'store_room',
  'other',
] as const;

export type FinanceInventoryLocationType =
  (typeof FINANCE_INVENTORY_LOCATION_TYPE_VALUES)[number];

export type TFinanceInventoryLocation = Document & {
  organization: Types.ObjectId;
  code: string;
  name: string;
  type: FinanceInventoryLocationType;
  is_active: boolean;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
};

const FinanceInventoryLocationSchema =
  new Schema<TFinanceInventoryLocation>(
    {
      organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        select: false,
      },
      code: { type: String, required: true, trim: true },
      name: { type: String, required: true, trim: true },
      type: {
        type: String,
        enum: FINANCE_INVENTORY_LOCATION_TYPE_VALUES,
        required: true,
      },
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

FinanceInventoryLocationSchema.index(
  { organization: 1, code: 1 },
  { unique: true }
);
FinanceInventoryLocationSchema.plugin(multiTenancyPlugin);

export const FinanceInventoryLocationModel =
  models.FinanceInventoryLocation ||
  model<TFinanceInventoryLocation>(
    'FinanceInventoryLocation',
    FinanceInventoryLocationSchema,
    'inventory_locations'
  );
