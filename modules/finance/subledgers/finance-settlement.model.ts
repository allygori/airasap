import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import {
  FINANCE_SETTLEMENT_STATUS_VALUES,
  FINANCE_SUBLEDGER_TYPE_VALUES,
  type FinanceSettlementStatus,
  type FinanceSubledgerType,
} from './finance-subledger.constants';

export type TFinanceSettlement = Document & {
  organization: Types.ObjectId;
  balance_type: FinanceSubledgerType;
  source_journal_entry: Types.ObjectId;
  source_item_id?: Types.ObjectId | null;
  source_type: string;
  source_id: string;
  source_description: string;
  amount: number;
  settlement_date: Date;
  payment_account: Types.ObjectId;
  payment_account_code: string;
  payment_account_name: string;
  reference?: string | null;
  description: string;
  status: FinanceSettlementStatus;
  journal_entry?: Types.ObjectId | null;
  idempotency_key: string;
  created_at?: Date;
  updated_at?: Date;
};

const FinanceSettlementSchema =
  new Schema<TFinanceSettlement>(
    {
      organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        select: false,
      },
      balance_type: {
        type: String,
        enum: FINANCE_SUBLEDGER_TYPE_VALUES,
        required: true,
      },
      source_journal_entry: {
        type: Schema.Types.ObjectId,
        ref: 'FinanceJournalEntry',
        required: true,
      },
      source_item_id: {
        type: Schema.Types.ObjectId,
        default: null,
      },
      source_type: { type: String, required: true },
      source_id: { type: String, required: true },
      source_description: { type: String, required: true },
      amount: { type: Number, required: true, min: 1 },
      settlement_date: { type: Date, required: true },
      payment_account: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      payment_account_code: {
        type: String,
        required: true,
      },
      payment_account_name: {
        type: String,
        required: true,
      },
      reference: { type: String, default: null },
      description: { type: String, required: true },
      status: {
        type: String,
        enum: FINANCE_SETTLEMENT_STATUS_VALUES,
        default: 'pending',
      },
      journal_entry: {
        type: Schema.Types.ObjectId,
        ref: 'FinanceJournalEntry',
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

FinanceSettlementSchema.index(
  { organization: 1, idempotency_key: 1 },
  { unique: true }
);
FinanceSettlementSchema.index({
  organization: 1,
  source_journal_entry: 1,
  source_item_id: 1,
  status: 1,
});
FinanceSettlementSchema.index({
  organization: 1,
  settlement_date: -1,
});

FinanceSettlementSchema.plugin(multiTenancyPlugin);

export const FinanceSettlementModel =
  models.FinanceSettlement ||
  model<TFinanceSettlement>(
    'FinanceSettlement',
    FinanceSettlementSchema,
    'finance_settlements'
  );
