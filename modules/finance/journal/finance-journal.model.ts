import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import {
  FINANCE_JOURNAL_STATUS_VALUES,
  type FinanceJournalStatus,
} from './finance-journal.constants';

export type TFinanceJournalLine = {
  account_id: Types.ObjectId;
  debit: number;
  credit: number;
  description?: string;
  dimensions?: {
    platform?: string;
    store_id?: string;
    inventory_location_id?: string;
    product_id?: string;
  };
};

export type TFinanceJournalEntry = Document & {
  organization: Types.ObjectId;
  entry_number: string;
  transaction_date: Date;
  posting_date: Date;
  period: string;
  currency: string;
  description: string;
  source_type: string;
  source_id: string;
  source_event: string;
  idempotency_key: string;
  idempotency_hash: string;
  status: FinanceJournalStatus;
  posted_at: Date;
  posted_by?: Types.ObjectId;
  lines: TFinanceJournalLine[];
  created_at?: Date;
  updated_at?: Date;
};

const FinanceJournalLineMongooseSchema =
  new Schema<TFinanceJournalLine>(
    {
      account_id: {
        type: Schema.Types.ObjectId,
        ref: 'FinanceAccount',
        required: true,
      },
      debit: { type: Number, required: true, min: 0 },
      credit: { type: Number, required: true, min: 0 },
      description: { type: String },
      dimensions: {
        platform: { type: String },
        store_id: { type: String },
        inventory_location_id: { type: String },
        product_id: { type: String },
      },
    },
    { _id: false }
  );

const FinanceJournalEntrySchema =
  new Schema<TFinanceJournalEntry>(
    {
      organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        select: false,
      },
      entry_number: { type: String, required: true },
      transaction_date: { type: Date, required: true },
      posting_date: { type: Date, required: true },
      period: { type: String, required: true },
      currency: {
        type: String,
        required: true,
        default: 'IDR',
      },
      description: { type: String, required: true },
      source_type: { type: String, required: true },
      source_id: { type: String, required: true },
      source_event: { type: String, required: true },
      idempotency_key: { type: String, required: true },
      idempotency_hash: { type: String, required: true },
      status: {
        type: String,
        enum: FINANCE_JOURNAL_STATUS_VALUES,
        required: true,
        default: 'posted',
      },
      posted_at: { type: Date, required: true },
      posted_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      lines: {
        type: [FinanceJournalLineMongooseSchema],
        required: true,
        validate: {
          validator: (lines: TFinanceJournalLine[]) =>
            lines.length >= 2,
          message: 'Journal minimal memiliki dua line.',
        },
      },
    },
    {
      timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    }
  );

FinanceJournalEntrySchema.pre(
  'validate',
  function (this: TFinanceJournalEntry) {
    if (
      this.status !== 'posted' &&
      this.status !== 'reversed'
    ) {
      return;
    }

    const debit = this.lines.reduce(
      (sum, line) => sum + line.debit,
      0
    );
    const credit = this.lines.reduce(
      (sum, line) => sum + line.credit,
      0
    );
    const hasInvalidLine = this.lines.some(
      (line) =>
        (line.debit > 0 && line.credit > 0) ||
        (line.debit === 0 && line.credit === 0)
    );

    if (hasInvalidLine) {
      throw new Error(
        'Setiap journal line harus memiliki tepat satu sisi yang bernilai.'
      );
    }

    if (debit !== credit) {
      throw new Error(
        'Total debit dan credit harus sama untuk journal posted.'
      );
    }
  }
);

FinanceJournalEntrySchema.index(
  { organization: 1, entry_number: 1 },
  { unique: true }
);
FinanceJournalEntrySchema.index({
  organization: 1,
  period: 1,
  transaction_date: 1,
});
FinanceJournalEntrySchema.index(
  { organization: 1, idempotency_key: 1 },
  {
    unique: true,
    partialFilterExpression: {
      idempotency_key: { $exists: true },
    },
  }
);

FinanceJournalEntrySchema.plugin(multiTenancyPlugin);

export const FinanceJournalEntryModel =
  models.FinanceJournalEntry ||
  model<TFinanceJournalEntry>(
    'FinanceJournalEntry',
    FinanceJournalEntrySchema,
    'finance_journal_entries'
  );
