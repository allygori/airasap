import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import { JournalEntryBaseDTO } from './journal-entry.dto';

export type TJournalLine = {
  account: Types.ObjectId;
  debit: number;
  credit: number;
  description?: string;
  dimensions?: {
    channel?: string;
    store?: string;
    warehouse?: string;
    product?: string;
  };
};

export type TJournalEntry = Document &
  Omit<
    JournalEntryBaseDTO,
    | 'lines'
    | 'transaction_date'
    | 'posting_date'
    | 'posted_at'
    | 'posted_by'
    | 'reversal_of'
  > & {
    organization: Types.ObjectId;
    transaction_date: Date;
    posting_date: Date;
    lines: TJournalLine[];
    posted_at?: Date;
    posted_by?: Types.ObjectId;
    reversal_of?: Types.ObjectId;
    created_at?: Date;
    updated_at?: Date;
  };

const JournalLineMongooseSchema = new Schema<TJournalLine>(
  {
    account: {
      type: Schema.Types.ObjectId,
      ref: 'AccountingAccount',
      required: true,
    },
    debit: { type: Number, required: true, min: 0 },
    credit: { type: Number, required: true, min: 0 },
    description: { type: String },
    dimensions: {
      channel: { type: String },
      store: { type: String },
      warehouse: { type: String },
      product: { type: String },
    },
  },
  { _id: false }
);

const JournalEntrySchema = new Schema<TJournalEntry>(
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
    source_type: { type: String },
    source_id: { type: String },
    source_event: { type: String },
    idempotency_key: { type: String },
    status: {
      type: String,
      enum: ['draft', 'posted', 'reversed'],
      default: 'draft',
    },
    posted_at: { type: Date },
    posted_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reversal_of: {
      type: Schema.Types.ObjectId,
      ref: 'JournalEntry',
    },
    lines: {
      type: [JournalLineMongooseSchema],
      required: true,
      validate: {
        validator: (lines: TJournalLine[]) =>
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

JournalEntrySchema.pre(
  'validate',
  function (this: TJournalEntry) {
    if (this.status !== 'draft') {
      const debit = this.lines.reduce(
        (sum, line) => sum + line.debit,
        0
      );
      const credit = this.lines.reduce(
        (sum, line) => sum + line.credit,
        0
      );

      if (debit !== credit) {
        throw new Error(
          'Total debit dan credit harus sama untuk journal posted/reversed.'
        );
      }
    }
  }
);

JournalEntrySchema.index(
  { organization: 1, entry_number: 1 },
  { unique: true }
);
JournalEntrySchema.index({
  organization: 1,
  period: 1,
  transaction_date: 1,
});
JournalEntrySchema.index({
  organization: 1,
  reversal_of: 1,
});
JournalEntrySchema.index(
  { organization: 1, idempotency_key: 1 },
  {
    unique: true,
    partialFilterExpression: {
      idempotency_key: { $exists: true },
    },
  }
);

JournalEntrySchema.plugin(multiTenancyPlugin);

export const JournalEntryModel =
  models.JournalEntry ||
  model<TJournalEntry>(
    'JournalEntry',
    JournalEntrySchema,
    'accounting_journal_entries'
  );
