import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import { InventoryLocationBaseDTO } from './inventory-location.dto';

export type TInventoryLocation = Document &
  InventoryLocationBaseDTO & {
    organization: Types.ObjectId;
    created_at?: Date;
    updated_at?: Date;
  };

const InventoryLocationSchema =
  new Schema<TInventoryLocation>(
    {
      organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        select: false,
      },
      code: { type: String, required: true, trim: true },
      name: { type: String, required: true, trim: true },
      type: { type: String, required: true },
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

InventoryLocationSchema.index(
  { organization: 1, code: 1 },
  { unique: true }
);
InventoryLocationSchema.plugin(multiTenancyPlugin);

export const InventoryLocationModel =
  models.InventoryLocation ||
  model<TInventoryLocation>(
    'InventoryLocation',
    InventoryLocationSchema,
    'inventory_locations'
  );
