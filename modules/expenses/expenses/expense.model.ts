import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import { ExpenseBaseDTO } from './expense.dto';

export type TExpense = Document &
  Omit<
    ExpenseBaseDTO,
    | 'expense_account'
    | 'payment_account'
    | 'attachment'
    | 'expense_date'
  > & {
    organization: Types.ObjectId;
    expense_account: Types.ObjectId;
    payment_account?: Types.ObjectId;
    attachment?: Types.ObjectId;
    expense_date: Date;
    journal_entry?: Types.ObjectId;
    created_at?: Date;
    updated_at?: Date;
  };

const ExpenseSchema = new Schema<TExpense>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      select: false,
    },
    expense_account: {
      type: Schema.Types.ObjectId,
      ref: 'AccountingAccount',
      required: true,
    },
    payment_account: {
      type: Schema.Types.ObjectId,
      ref: 'AccountingAccount',
    },
    amount: { type: Number, required: true, min: 1 },
    currency: {
      type: String,
      required: true,
      default: 'IDR',
    },
    expense_date: { type: Date, required: true },
    description: { type: String, required: true },
    vendor_name: { type: String },
    source_type: { type: String },
    source_id: { type: String },
    idempotency_key: { type: String },
    dimensions: {
      platform: { type: String },
      store: { type: String },
      inventory_location: { type: String },
      product: { type: String },
    },
    attachment: {
      type: Schema.Types.ObjectId,
      ref: 'File',
    },
    journal_entry: {
      type: Schema.Types.ObjectId,
      ref: 'JournalEntry',
    },
    status: {
      type: String,
      enum: ['draft', 'posted', 'voided'],
      default: 'draft',
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

ExpenseSchema.index({
  organization: 1,
  expense_date: -1,
});
ExpenseSchema.index({
  organization: 1,
  journal_entry: 1,
});
ExpenseSchema.index(
  { organization: 1, idempotency_key: 1 },
  {
    unique: true,
    partialFilterExpression: {
      idempotency_key: { $exists: true },
    },
  }
);
ExpenseSchema.plugin(multiTenancyPlugin);

export const ExpenseModel =
  models.Expense ||
  model<TExpense>('Expense', ExpenseSchema, 'expenses');
