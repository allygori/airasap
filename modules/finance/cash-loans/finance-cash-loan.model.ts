import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import {
  FINANCE_CASH_LOAN_EVENT_TYPE_VALUES,
  FINANCE_CASH_LOAN_LENDER_TYPE_VALUES,
  FINANCE_CASH_LOAN_STATUS_VALUES,
  type FinanceCashLoanEventType,
  type FinanceCashLoanLenderType,
  type FinanceCashLoanStatus,
} from './finance-cash-loan.constants';

export type TFinanceCashLoan = Document & {
  organization: Types.ObjectId;
  event_type: FinanceCashLoanEventType;
  lender_key: string;
  lender_type: FinanceCashLoanLenderType;
  lender_name: string;
  owner_account: Types.ObjectId | null;
  owner_account_code: string | null;
  owner_account_name: string | null;
  liability_account_code: string;
  liability_account_name: string;
  payment_account: Types.ObjectId;
  payment_account_code: string;
  payment_account_name: string;
  amount: number;
  transaction_date: Date;
  description: string;
  reference?: string | null;
  status: FinanceCashLoanStatus;
  journal_entry?: Types.ObjectId | null;
  reversal_journal_entry?: Types.ObjectId | null;
  idempotency_key: string;
  created_at?: Date;
  updated_at?: Date;
};

const FinanceCashLoanSchema = new Schema<TFinanceCashLoan>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      select: false,
    },
    event_type: {
      type: String,
      enum: FINANCE_CASH_LOAN_EVENT_TYPE_VALUES,
      required: true,
    },
    lender_key: { type: String, required: true },
    lender_type: {
      type: String,
      enum: FINANCE_CASH_LOAN_LENDER_TYPE_VALUES,
      required: true,
    },
    lender_name: {
      type: String,
      required: true,
      trim: true,
    },
    owner_account: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    owner_account_code: { type: String, default: null },
    owner_account_name: { type: String, default: null },
    liability_account_code: {
      type: String,
      required: true,
    },
    liability_account_name: {
      type: String,
      required: true,
    },
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
      enum: FINANCE_CASH_LOAN_STATUS_VALUES,
      default: 'draft',
    },
    journal_entry: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    reversal_journal_entry: {
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

FinanceCashLoanSchema.index(
  { organization: 1, idempotency_key: 1 },
  { unique: true }
);
FinanceCashLoanSchema.index({
  organization: 1,
  transaction_date: -1,
  created_at: -1,
});
FinanceCashLoanSchema.index({
  organization: 1,
  lender_key: 1,
  status: 1,
});
FinanceCashLoanSchema.index({
  organization: 1,
  journal_entry: 1,
});

FinanceCashLoanSchema.plugin(multiTenancyPlugin);

export const FinanceCashLoanModel =
  models.FinanceCashLoan ||
  model<TFinanceCashLoan>(
    'FinanceCashLoan',
    FinanceCashLoanSchema,
    'finance_cash_loans'
  );
