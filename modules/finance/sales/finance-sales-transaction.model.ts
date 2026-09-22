import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import {
  FINANCE_SALES_POSTING_EVENT_VALUES,
  FINANCE_SALES_POSTING_MODE_VALUES,
  FINANCE_SALES_TRANSACTION_STATUS_VALUES,
  FINANCE_SALES_INVENTORY_COGS_STATUS_VALUES,
  type FinanceSalesPostingMode,
  type FinanceSalesTransactionStatus,
} from './finance-sales.constants';

export type TFinanceSalesTransactionSourceLine = {
  source_line_id: string;
  product_reference_id: string | null;
  product_id: string | null;
  variation_id: string | null;
  product_name: string | null;
  variation_name: string | null;
  parent_sku: string | null;
  child_sku: string | null;
  quantity: number;
  returned_quantity: number;
  final_quantity: number;
  subtotal: number | null;
  gross_sales: number | null;
  net_sales: number | null;
  product_cost: number | null;
  total_product_cost: number | null;
};

export type TFinanceSalesTransactionIntentLine = {
  account_role: string;
  debit: number;
  credit: number;
};

export type TFinanceSalesTransaction = Document & {
  organization: Types.ObjectId;
  source_order_id: string;
  source_order_number: string;
  store_id: string | null;
  platform: string;
  source_status: string | null;
  transaction_date: Date | null;
  currency: string;
  sales_amount: number | null;
  posting_mode: FinanceSalesPostingMode;
  status: FinanceSalesTransactionStatus;
  idempotency_key: string;
  blocked_reason: string | null;
  journal_entry_id: Types.ObjectId | null;
  source_lines: TFinanceSalesTransactionSourceLine[];
  intent_source_event:
    | (typeof FINANCE_SALES_POSTING_EVENT_VALUES)[number]
    | null;
  intent_transaction_date: Date | null;
  intent_description: string | null;
  intent_lines: TFinanceSalesTransactionIntentLine[];
  inventory_cogs_deferred_reason: string | null;
  inventory_cogs_status: 'deferred' | 'posted';
  inventory_cogs_total_cost: number | null;
  inventory_movement_ids: Types.ObjectId[];
  created_at?: Date;
  updated_at?: Date;
};

const SourceLineSchema =
  new Schema<TFinanceSalesTransactionSourceLine>(
    {
      source_line_id: { type: String, required: true },
      product_reference_id: { type: String, default: null },
      product_id: { type: String, default: null },
      variation_id: { type: String, default: null },
      product_name: { type: String, default: null },
      variation_name: { type: String, default: null },
      parent_sku: { type: String, default: null },
      child_sku: { type: String, default: null },
      quantity: { type: Number, required: true, min: 0 },
      returned_quantity: {
        type: Number,
        required: true,
        min: 0,
      },
      final_quantity: {
        type: Number,
        required: true,
        min: 0,
      },
      subtotal: { type: Number, default: null, min: 0 },
      gross_sales: { type: Number, default: null, min: 0 },
      net_sales: { type: Number, default: null, min: 0 },
      product_cost: { type: Number, default: null, min: 0 },
      total_product_cost: {
        type: Number,
        default: null,
        min: 0,
      },
    },
    { _id: false }
  );

const IntentLineSchema =
  new Schema<TFinanceSalesTransactionIntentLine>(
    {
      account_role: { type: String, required: true },
      debit: { type: Number, required: true, min: 0 },
      credit: { type: Number, required: true, min: 0 },
    },
    { _id: false }
  );

const FinanceSalesTransactionSchema =
  new Schema<TFinanceSalesTransaction>(
    {
      organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        select: false,
      },
      source_order_id: { type: String, required: true },
      source_order_number: { type: String, required: true },
      store_id: { type: String, default: null },
      platform: { type: String, required: true },
      source_status: { type: String, default: null },
      transaction_date: { type: Date, default: null },
      currency: {
        type: String,
        required: true,
        default: 'IDR',
      },
      sales_amount: { type: Number, default: null, min: 0 },
      posting_mode: {
        type: String,
        enum: FINANCE_SALES_POSTING_MODE_VALUES,
        required: true,
      },
      status: {
        type: String,
        enum: FINANCE_SALES_TRANSACTION_STATUS_VALUES,
        required: true,
      },
      idempotency_key: { type: String, required: true },
      blocked_reason: { type: String, default: null },
      journal_entry_id: {
        type: Schema.Types.ObjectId,
        ref: 'FinanceJournalEntry',
        default: null,
      },
      source_lines: {
        type: [SourceLineSchema],
        required: true,
      },
      intent_source_event: {
        type: String,
        enum: FINANCE_SALES_POSTING_EVENT_VALUES,
        default: null,
      },
      intent_transaction_date: {
        type: Date,
        default: null,
      },
      intent_description: { type: String, default: null },
      intent_lines: {
        type: [IntentLineSchema],
        default: [],
      },
      inventory_cogs_deferred_reason: {
        type: String,
        default: null,
      },
      inventory_cogs_status: {
        type: String,
        enum: FINANCE_SALES_INVENTORY_COGS_STATUS_VALUES,
        default: 'deferred',
      },
      inventory_cogs_total_cost: {
        type: Number,
        default: null,
        min: 0,
      },
      inventory_movement_ids: {
        type: [Schema.Types.ObjectId],
        default: [],
      },
    },
    {
      timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    }
  );

FinanceSalesTransactionSchema.index(
  { organization: 1, idempotency_key: 1 },
  { unique: true }
);
FinanceSalesTransactionSchema.index({
  organization: 1,
  status: 1,
  created_at: -1,
});
FinanceSalesTransactionSchema.index({
  organization: 1,
  source_order_id: 1,
});

FinanceSalesTransactionSchema.plugin(multiTenancyPlugin);

export const FinanceSalesTransactionModel =
  models.FinanceSalesTransaction ||
  model<TFinanceSalesTransaction>(
    'FinanceSalesTransaction',
    FinanceSalesTransactionSchema,
    'finance_sales_transactions'
  );
