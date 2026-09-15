import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import { InventoryMovementBaseDTO } from './inventory-movement.dto';

export type TInventoryMovement = Document &
  Omit<
    InventoryMovementBaseDTO,
    'inventory_item' | 'location' | 'occurred_at'
  > & {
    organization: Types.ObjectId;
    inventory_item: Types.ObjectId;
    location: Types.ObjectId;
    occurred_at: Date;
    created_at?: Date;
    updated_at?: Date;
  };

const InventoryMovementSchema =
  new Schema<TInventoryMovement>(
    {
      organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        select: false,
      },
      inventory_item: {
        type: Schema.Types.ObjectId,
        ref: 'InventoryItem',
        required: true,
      },
      location: {
        type: Schema.Types.ObjectId,
        ref: 'InventoryLocation',
        required: true,
      },
      movement_type: { type: String, required: true },
      quantity: { type: Number, required: true, min: 0 },
      unit_cost: { type: Number, min: 0 },
      total_cost: { type: Number, min: 0 },
      occurred_at: { type: Date, required: true },
      source_type: { type: String },
      source_id: { type: String },
      idempotency_key: { type: String },
      reference: { type: String },
      notes: { type: String },
      status: {
        type: String,
        enum: ['draft', 'posted', 'voided'],
        default: 'draft',
      },
    },
    {
      timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    }
  );

InventoryMovementSchema.index({
  organization: 1,
  inventory_item: 1,
  occurred_at: 1,
});
InventoryMovementSchema.index(
  { organization: 1, idempotency_key: 1 },
  {
    unique: true,
    partialFilterExpression: {
      idempotency_key: { $exists: true },
    },
  }
);
InventoryMovementSchema.plugin(multiTenancyPlugin);

export const InventoryMovementModel =
  models.InventoryMovement ||
  model<TInventoryMovement>(
    'InventoryMovement',
    InventoryMovementSchema,
    'inventory_movements'
  );
