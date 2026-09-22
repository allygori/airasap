import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';

export type TFinanceCashBankTransfer = Document & {
  organization: Types.ObjectId;
  source_account: Types.ObjectId;
  source_account_code: string;
  source_account_name: string;
  destination_account: Types.ObjectId;
  destination_account_code: string;
  destination_account_name: string;
  amount: number;
  transaction_date: Date;
  reference: string | null;
  description: string;
  idempotency_key: string;
  status: 'pending' | 'posted' | 'reversed';
  journal_entry?: Types.ObjectId | null;
  reversal_journal_entry?: Types.ObjectId | null;
  created_at?: Date;
  updated_at?: Date;
};

const FinanceCashBankTransferSchema =
  new Schema<TFinanceCashBankTransfer>(
    {
      organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        select: false,
      },
      source_account: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      source_account_code: { type: String, required: true },
      source_account_name: { type: String, required: true },
      destination_account: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      destination_account_code: {
        type: String,
        required: true,
      },
      destination_account_name: {
        type: String,
        required: true,
      },
      amount: { type: Number, required: true, min: 1 },
      transaction_date: { type: Date, required: true },
      reference: { type: String, default: null },
      description: { type: String, required: true },
      idempotency_key: { type: String, required: true },
      status: {
        type: String,
        enum: ['pending', 'posted', 'reversed'],
        default: 'pending',
      },
      journal_entry: {
        type: Schema.Types.ObjectId,
        default: null,
      },
      reversal_journal_entry: {
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

FinanceCashBankTransferSchema.index(
  { organization: 1, idempotency_key: 1 },
  { unique: true }
);
FinanceCashBankTransferSchema.index({
  organization: 1,
  transaction_date: -1,
});
FinanceCashBankTransferSchema.index({
  organization: 1,
  source_account: 1,
  destination_account: 1,
});

FinanceCashBankTransferSchema.plugin(multiTenancyPlugin);

export const FinanceCashBankTransferModel =
  models.FinanceCashBankTransfer ||
  model<TFinanceCashBankTransfer>(
    'FinanceCashBankTransfer',
    FinanceCashBankTransferSchema,
    'finance_cash_bank_transfers'
  );
