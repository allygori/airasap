import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import {
  FINANCE_EXPENSE_PAYMENT_TIMING_VALUES,
  FINANCE_EXPENSE_STATUS_VALUES,
  type FinanceExpensePaymentTiming,
  type FinanceExpenseStatus,
} from './finance-expense.constants';

export type TFinanceExpense = Document & {
  organization: Types.ObjectId;
  category_account: Types.ObjectId;
  category_account_code: string;
  category_account_name: string;
  amount: number;
  expense_date: Date;
  description: string;
  vendor_name?: string | null;
  reference?: string | null;
  payment_timing: FinanceExpensePaymentTiming;
  payment_account?: Types.ObjectId | null;
  payment_account_code?: string | null;
  payment_account_name?: string | null;
  offset_account?: Types.ObjectId | null;
  offset_account_code?: string | null;
  offset_account_name?: string | null;
  notes?: string | null;
  attachment_reference?: string | null;
  status: FinanceExpenseStatus;
  journal_entry?: Types.ObjectId | null;
  idempotency_key: string;
  created_at?: Date;
  updated_at?: Date;
};

const FinanceExpenseSchema = new Schema<TFinanceExpense>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      select: false,
    },
    category_account: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    category_account_code: { type: String, required: true },
    category_account_name: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    expense_date: { type: Date, required: true },
    description: { type: String, required: true },
    vendor_name: { type: String, default: null },
    reference: { type: String, default: null },
    payment_timing: {
      type: String,
      enum: FINANCE_EXPENSE_PAYMENT_TIMING_VALUES,
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
    notes: { type: String, default: null },
    attachment_reference: { type: String, default: null },
    status: {
      type: String,
      enum: FINANCE_EXPENSE_STATUS_VALUES,
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

FinanceExpenseSchema.index(
  { organization: 1, idempotency_key: 1 },
  { unique: true }
);
FinanceExpenseSchema.index({
  organization: 1,
  expense_date: -1,
  created_at: -1,
});
FinanceExpenseSchema.index({
  organization: 1,
  status: 1,
  expense_date: -1,
});

FinanceExpenseSchema.plugin(multiTenancyPlugin);

export const FinanceExpenseModel =
  models.FinanceExpense ||
  model<TFinanceExpense>(
    'FinanceExpense',
    FinanceExpenseSchema,
    'finance_expenses'
  );
