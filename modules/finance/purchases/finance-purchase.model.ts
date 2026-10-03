import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import {
  FINANCE_PURCHASE_PAYMENT_TIMING_VALUES,
  FINANCE_PURCHASE_STATUS_VALUES,
  type FinancePurchasePaymentTiming,
  type FinancePurchaseStatus,
} from './finance-purchase.constants';

export type TFinancePurchaseLine = {
  inventory_item: Types.ObjectId;
  item_sku: string;
  item_name: string;
  location: Types.ObjectId;
  location_code: string;
  location_name: string;
  quantity: number;
  unit_cost: number;
  line_total: number;
};

export type TFinancePurchase = Document & {
  organization: Types.ObjectId;
  supplier?: Types.ObjectId | null;
  supplier_name_snapshot?: string | null;
  supplier_document_reference?: string | null;
  transaction_date: Date;
  payment_timing: FinancePurchasePaymentTiming;
  payment_account?: Types.ObjectId | null;
  payment_account_code?: string | null;
  payment_account_name?: string | null;
  offset_account?: Types.ObjectId | null;
  offset_account_code?: string | null;
  offset_account_name?: string | null;
  lines: TFinancePurchaseLine[];
  inventory_movements: Types.ObjectId[];
  total_amount: number;
  notes?: string | null;
  status: FinancePurchaseStatus;
  journal_entry?: Types.ObjectId | null;
  idempotency_key: string;
  created_at?: Date;
  updated_at?: Date;
};

const FinancePurchaseLineSchema =
  new Schema<TFinancePurchaseLine>(
    {
      inventory_item: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      item_sku: {
        type: String,
        required: true,
        trim: true,
      },
      item_name: {
        type: String,
        required: true,
        trim: true,
      },
      location: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      location_code: {
        type: String,
        required: true,
        trim: true,
      },
      location_name: {
        type: String,
        required: true,
        trim: true,
      },
      quantity: { type: Number, required: true, min: 1 },
      unit_cost: { type: Number, required: true, min: 1 },
      line_total: { type: Number, required: true, min: 1 },
    },
    { _id: false }
  );

const FinancePurchaseSchema = new Schema<TFinancePurchase>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      select: false,
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'FinanceSupplier',
      default: null,
    },
    supplier_name_snapshot: { type: String, default: null },
    supplier_document_reference: {
      type: String,
      default: null,
    },
    transaction_date: { type: Date, required: true },
    payment_timing: {
      type: String,
      enum: FINANCE_PURCHASE_PAYMENT_TIMING_VALUES,
      required: true,
    },
    payment_account: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    payment_account_code: { type: String, default: null },
    payment_account_name: { type: String, default: null },
    offset_account: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    offset_account_code: { type: String, default: null },
    offset_account_name: { type: String, default: null },
    lines: {
      type: [FinancePurchaseLineSchema],
      required: true,
      validate: {
        validator: (value: TFinancePurchaseLine[]) =>
          value.length > 0,
        message:
          'Purchase harus memiliki minimal satu line.',
      },
    },
    inventory_movements: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
    total_amount: { type: Number, required: true, min: 1 },
    notes: { type: String, default: null },
    status: {
      type: String,
      enum: FINANCE_PURCHASE_STATUS_VALUES,
      default: 'draft',
    },
    journal_entry: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    idempotency_key: { type: String, required: true },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

FinancePurchaseSchema.index(
  { organization: 1, idempotency_key: 1 },
  { unique: true }
);
FinancePurchaseSchema.index({
  organization: 1,
  transaction_date: -1,
  created_at: -1,
});
FinancePurchaseSchema.index({
  organization: 1,
  status: 1,
  transaction_date: -1,
});

FinancePurchaseSchema.plugin(multiTenancyPlugin);

export const FinancePurchaseModel =
  models.FinancePurchase ||
  model<TFinancePurchase>(
    'FinancePurchase',
    FinancePurchaseSchema,
    'finance_purchases'
  );
