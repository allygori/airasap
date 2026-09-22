import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import type { FinanceSubledgerType } from '../subledgers/finance-subledger.constants';

export type TFinanceOpeningBalanceSubledgerItem =
  Document & {
    organization: Types.ObjectId;
    opening_balance_draft: Types.ObjectId;
    journal_entry: Types.ObjectId;
    balance_type: FinanceSubledgerType;
    account_id: Types.ObjectId;
    source_id: string;
    source_label: string;
    description: string;
    transaction_date: Date;
    currency: string;
    amount: number;
    counterparty?: string;
    reference?: string;
    status: 'posted';
    created_at?: Date;
    updated_at?: Date;
  };

const FinanceOpeningBalanceSubledgerItemSchema =
  new Schema<TFinanceOpeningBalanceSubledgerItem>(
    {
      organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        select: false,
      },
      opening_balance_draft: {
        type: Schema.Types.ObjectId,
        ref: 'FinanceOpeningBalanceDraft',
        required: true,
      },
      journal_entry: {
        type: Schema.Types.ObjectId,
        ref: 'FinanceJournalEntry',
        required: true,
      },
      balance_type: {
        type: String,
        enum: ['receivable', 'payable'],
        required: true,
      },
      account_id: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      source_id: { type: String, required: true },
      source_label: { type: String, required: true },
      description: { type: String, required: true },
      transaction_date: { type: Date, required: true },
      currency: {
        type: String,
        required: true,
        default: 'IDR',
      },
      amount: { type: Number, required: true, min: 1 },
      counterparty: {
        type: String,
        trim: true,
        maxlength: 160,
      },
      reference: {
        type: String,
        trim: true,
        maxlength: 160,
      },
      status: {
        type: String,
        enum: ['posted'],
        default: 'posted',
      },
    },
    {
      timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    }
  );

FinanceOpeningBalanceSubledgerItemSchema.index(
  {
    organization: 1,
    opening_balance_draft: 1,
    source_id: 1,
  },
  { unique: true }
);
FinanceOpeningBalanceSubledgerItemSchema.index({
  organization: 1,
  balance_type: 1,
  account_id: 1,
  status: 1,
  transaction_date: -1,
});
FinanceOpeningBalanceSubledgerItemSchema.plugin(
  multiTenancyPlugin
);

export const FinanceOpeningBalanceSubledgerItemModel =
  models.FinanceOpeningBalanceSubledgerItem ||
  model<TFinanceOpeningBalanceSubledgerItem>(
    'FinanceOpeningBalanceSubledgerItem',
    FinanceOpeningBalanceSubledgerItemSchema,
    'finance_opening_balance_subledger_items'
  );
