import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import type { FinanceMarketplaceReleaseStatusDTO } from './finance-marketplace-release.schema';

export type FinanceMarketplaceReleaseFeeLine = {
  category: string;
  amount: number;
};

export type TFinanceMarketplaceRelease = Document & {
  organization: Types.ObjectId;
  source_order_reference: Types.ObjectId;
  source_order_id: string;
  source_order_number: string;
  store_id: Types.ObjectId | null;
  platform: string;
  settlement_reference: string;
  released_at: Date | null;
  expected_gross_amount: number | null;
  fee_amount: number | null;
  refund_amount: number | null;
  released_amount: number | null;
  reconciliation_difference: number | null;
  fee_lines: FinanceMarketplaceReleaseFeeLine[];
  status: FinanceMarketplaceReleaseStatusDTO;
  blocked_reason: string | null;
  journal_entry_id: Types.ObjectId | null;
  idempotency_key: string;
  source_file_id: Types.ObjectId | null;
  created_at?: Date;
  updated_at?: Date;
};

const FeeLineSchema =
  new Schema<FinanceMarketplaceReleaseFeeLine>(
    {
      category: { type: String, required: true },
      amount: { type: Number, required: true, min: 1 },
    },
    { _id: false }
  );

const FinanceMarketplaceReleaseSchema =
  new Schema<TFinanceMarketplaceRelease>(
    {
      organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        select: false,
      },
      source_order_reference: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
      },
      source_order_id: { type: String, required: true },
      source_order_number: { type: String, required: true },
      store_id: {
        type: Schema.Types.ObjectId,
        default: null,
      },
      platform: { type: String, required: true },
      settlement_reference: {
        type: String,
        required: true,
      },
      released_at: { type: Date, default: null },
      expected_gross_amount: {
        type: Number,
        default: null,
        min: 0,
      },
      fee_amount: { type: Number, default: null, min: 0 },
      refund_amount: {
        type: Number,
        default: null,
        min: 0,
      },
      released_amount: {
        type: Number,
        default: null,
        min: 0,
      },
      reconciliation_difference: {
        type: Number,
        default: null,
      },
      fee_lines: { type: [FeeLineSchema], default: [] },
      status: {
        type: String,
        enum: ['pending', 'blocked', 'posted'],
        required: true,
      },
      blocked_reason: { type: String, default: null },
      journal_entry_id: {
        type: Schema.Types.ObjectId,
        ref: 'FinanceJournalEntry',
        default: null,
      },
      idempotency_key: { type: String, required: true },
      source_file_id: {
        type: Schema.Types.ObjectId,
        default: null,
      },
    },
    {
      timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    }
  );

FinanceMarketplaceReleaseSchema.index(
  { organization: 1, idempotency_key: 1 },
  { unique: true }
);
FinanceMarketplaceReleaseSchema.index({
  organization: 1,
  source_order_id: 1,
  platform: 1,
  status: 1,
});
FinanceMarketplaceReleaseSchema.plugin(multiTenancyPlugin);

export const FinanceMarketplaceReleaseModel =
  models.FinanceMarketplaceRelease ||
  model<TFinanceMarketplaceRelease>(
    'FinanceMarketplaceRelease',
    FinanceMarketplaceReleaseSchema,
    'finance_marketplace_releases'
  );
