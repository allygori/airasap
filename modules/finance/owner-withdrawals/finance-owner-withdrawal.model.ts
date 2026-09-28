import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import { FINANCE_OWNER_WITHDRAWAL_STATUS_VALUES } from './finance-owner-withdrawal.constants';

export type TFinanceOwnerWithdrawal = Document & {
  organization: Types.ObjectId;
  owner_account: Types.ObjectId;
  owner_account_code: string;
  owner_account_name: string;
  payment_account: Types.ObjectId;
  payment_account_code: string;
  payment_account_name: string;
  amount: number;
  transaction_date: Date;
  description: string;
  reference?: string | null;
  status: 'draft' | 'posted';
  journal_entry?: Types.ObjectId | null;
  idempotency_key: string;
  created_at?: Date;
  updated_at?: Date;
};

const FinanceOwnerWithdrawalSchema =
  new Schema<TFinanceOwnerWithdrawal>(
    {
      organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        select: false,
      },
      owner_account: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      owner_account_code: { type: String, required: true },
      owner_account_name: { type: String, required: true },
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
      amount: { type: Number, required: true, min: 1 },
      transaction_date: { type: Date, required: true },
      description: {
        type: String,
        required: true,
        trim: true,
      },
      reference: {
        type: String,
        default: null,
        trim: true,
      },
      status: {
        type: String,
        enum: FINANCE_OWNER_WITHDRAWAL_STATUS_VALUES,
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

FinanceOwnerWithdrawalSchema.index(
  { organization: 1, idempotency_key: 1 },
  { unique: true }
);
FinanceOwnerWithdrawalSchema.index({
  organization: 1,
  transaction_date: -1,
  created_at: -1,
});
FinanceOwnerWithdrawalSchema.index({
  organization: 1,
  status: 1,
  transaction_date: -1,
});

FinanceOwnerWithdrawalSchema.plugin(multiTenancyPlugin);

export const FinanceOwnerWithdrawalModel =
  models.FinanceOwnerWithdrawal ||
  model<TFinanceOwnerWithdrawal>(
    'FinanceOwnerWithdrawal',
    FinanceOwnerWithdrawalSchema,
    'finance_owner_withdrawals'
  );
