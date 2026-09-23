import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import {
  FINANCE_INVENTORY_MOVEMENT_STATUS_VALUES,
  FINANCE_INVENTORY_MOVEMENT_TYPE_VALUES,
  type FinanceInventoryMovementStatus,
  type FinanceInventoryMovementType,
} from './finance-inventory.constants';
import type {
  FinanceInventoryAdjustmentDirection,
  FinanceInventoryAdjustmentReason,
} from './finance-inventory.constants';

export type TFinanceInventoryMovement = Document & {
  organization: Types.ObjectId;
  inventory_item: Types.ObjectId;
  location: Types.ObjectId;
  store?: Types.ObjectId;
  platform?: string;
  movement_type: FinanceInventoryMovementType;
  adjustment_direction?: FinanceInventoryAdjustmentDirection;
  adjustment_reason?: FinanceInventoryAdjustmentReason;
  quantity: number;
  unit_cost?: number | null;
  total_cost?: number | null;
  occurred_at: Date;
  source_type?: string;
  source_id?: string;
  offset_account?: Types.ObjectId;
  idempotency_key?: string;
  reference?: string;
  notes?: string;
  status: FinanceInventoryMovementStatus;
  journal_entry?: Types.ObjectId;
  created_at?: Date;
  updated_at?: Date;
};

const FinanceInventoryMovementSchema =
  new Schema<TFinanceInventoryMovement>(
    {
      organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        select: false,
      },
      inventory_item: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      location: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      store: { type: Schema.Types.ObjectId },
      platform: { type: String },
      movement_type: {
        type: String,
        enum: FINANCE_INVENTORY_MOVEMENT_TYPE_VALUES,
        required: true,
      },
      adjustment_direction: {
        type: String,
        enum: ['increase', 'decrease'],
      },
      adjustment_reason: {
        type: String,
        enum: ['stock_count', 'damage', 'loss', 'other'],
      },
      quantity: { type: Number, required: true, min: 0 },
      unit_cost: { type: Number, min: 0, default: null },
      total_cost: { type: Number, min: 0, default: null },
      occurred_at: { type: Date, required: true },
      source_type: { type: String },
      source_id: { type: String },
      offset_account: { type: Schema.Types.ObjectId },
      idempotency_key: { type: String },
      reference: { type: String },
      notes: { type: String },
      status: {
        type: String,
        enum: FINANCE_INVENTORY_MOVEMENT_STATUS_VALUES,
        default: 'draft',
      },
      journal_entry: { type: Schema.Types.ObjectId },
    },
    {
      timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    }
  );

FinanceInventoryMovementSchema.index({
  organization: 1,
  inventory_item: 1,
  occurred_at: 1,
});
FinanceInventoryMovementSchema.index({
  organization: 1,
  location: 1,
  occurred_at: 1,
});
FinanceInventoryMovementSchema.index(
  { organization: 1, idempotency_key: 1 },
  {
    unique: true,
    partialFilterExpression: {
      idempotency_key: { $exists: true },
    },
  }
);
FinanceInventoryMovementSchema.plugin(multiTenancyPlugin);

export const FinanceInventoryMovementModel =
  models.FinanceInventoryMovement ||
  model<TFinanceInventoryMovement>(
    'FinanceInventoryMovement',
    FinanceInventoryMovementSchema,
    'finance_inventory_movements'
  );
