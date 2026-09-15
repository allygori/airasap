import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import type { SettlementBaseDTO } from './settlement.dto';

export type TSettlement = Document &
  Omit<
    SettlementBaseDTO,
    | 'order'
    | 'destination_account'
    | 'settled_at'
    | 'source_file'
    | 'journal_entry'
    | 'fee_lines'
  > & {
    organization: Types.ObjectId;
    order: Types.ObjectId;
    destination_account: Types.ObjectId;
    settled_at: Date;
    source_file?: Types.ObjectId;
    journal_entry?: Types.ObjectId;
    fee_lines: Array<{
      category: string;
      account: Types.ObjectId;
      amount: number;
    }>;
    created_at?: Date;
    updated_at?: Date;
  };

const SettlementFeeLineSchema = new Schema(
  {
    category: { type: String, required: true },
    account: {
      type: Schema.Types.ObjectId,
      ref: 'AccountingAccount',
      required: true,
    },
    amount: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const SettlementSchema = new Schema<TSettlement>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      select: false,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    order_id: { type: String, required: true },
    platform: { type: String, required: true },
    settlement_reference: { type: String, required: true },
    settled_at: { type: Date, required: true },
    destination_account: {
      type: Schema.Types.ObjectId,
      ref: 'AccountingAccount',
      required: true,
    },
    gross_amount: { type: Number, required: true, min: 1 },
    fee_amount: { type: Number, required: true, min: 0 },
    net_amount: { type: Number, required: true, min: 0 },
    fee_lines: {
      type: [SettlementFeeLineSchema],
      default: [],
    },
    reconciliation_status: {
      type: String,
      enum: ['matched', 'exception'],
      required: true,
    },
    reconciliation_difference: {
      type: Number,
      required: true,
    },
    source_file: {
      type: Schema.Types.ObjectId,
      ref: 'File',
    },
    idempotency_key: { type: String, required: true },
    blocked_reason: { type: String },
    status: {
      type: String,
      enum: ['draft', 'posted', 'blocked', 'voided'],
      default: 'draft',
    },
    journal_entry: {
      type: Schema.Types.ObjectId,
      ref: 'JournalEntry',
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

SettlementSchema.index({
  organization: 1,
  order: 1,
  settled_at: 1,
});
SettlementSchema.index(
  { organization: 1, idempotency_key: 1 },
  { unique: true }
);
SettlementSchema.plugin(multiTenancyPlugin);

export const SettlementModel =
  models.MarketplaceSettlement ||
  model<TSettlement>(
    'MarketplaceSettlement',
    SettlementSchema,
    'marketplace_settlements'
  );
