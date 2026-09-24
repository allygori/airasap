import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import {
  FINANCE_INVENTORY_RESERVATION_STATUS_VALUES,
  type FinanceInventoryReservationStatus,
} from './finance-inventory.constants';

export type TFinanceInventoryReservation = Document & {
  organization: Types.ObjectId;
  source_order_id: string;
  source_line_id: string;
  platform: string;
  store_id: string | null;
  product_reference_id: string | null;
  variation_id: string | null;
  inventory_item: Types.ObjectId | null;
  location: Types.ObjectId | null;
  quantity: number;
  status: FinanceInventoryReservationStatus;
  source_status: string | null;
  reason: string | null;
  created_at?: Date;
  updated_at?: Date;
};

const FinanceInventoryReservationSchema =
  new Schema<TFinanceInventoryReservation>(
    {
      organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        select: false,
      },
      source_order_id: { type: String, required: true },
      source_line_id: { type: String, required: true },
      platform: { type: String, required: true },
      store_id: { type: String, default: null },
      product_reference_id: {
        type: String,
        default: null,
      },
      variation_id: { type: String, default: null },
      inventory_item: {
        type: Schema.Types.ObjectId,
        default: null,
      },
      location: {
        type: Schema.Types.ObjectId,
        default: null,
      },
      quantity: { type: Number, required: true, min: 0 },
      status: {
        type: String,
        enum: FINANCE_INVENTORY_RESERVATION_STATUS_VALUES,
        required: true,
      },
      source_status: { type: String, default: null },
      reason: { type: String, default: null },
    },
    {
      timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    }
  );

FinanceInventoryReservationSchema.index(
  {
    organization: 1,
    platform: 1,
    store_id: 1,
    source_order_id: 1,
    source_line_id: 1,
  },
  { unique: true }
);
FinanceInventoryReservationSchema.index({
  organization: 1,
  inventory_item: 1,
  location: 1,
  status: 1,
});
FinanceInventoryReservationSchema.plugin(
  multiTenancyPlugin
);

export const FinanceInventoryReservationModel =
  models.FinanceInventoryReservation ||
  model<TFinanceInventoryReservation>(
    'FinanceInventoryReservation',
    FinanceInventoryReservationSchema,
    'finance_inventory_reservations'
  );
