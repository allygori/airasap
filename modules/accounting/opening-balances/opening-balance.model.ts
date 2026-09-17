import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import { OpeningBalanceBaseDTO } from './opening-balance.dto';

type TOpeningBalanceLine = {
  account: Types.ObjectId;
  debit: number;
  credit: number;
  description?: string;
  counterparty?: string;
  due_date?: Date;
};

export type TOpeningBalance = Document &
  Omit<
    OpeningBalanceBaseDTO,
    'lines' | 'journal_entry' | 'effective_date'
  > & {
    organization: Types.ObjectId;
    effective_date: Date;
    journal_entry?: Types.ObjectId;
    lines: TOpeningBalanceLine[];
    created_at?: Date;
    updated_at?: Date;
  };

const OpeningBalanceLineMongooseSchema =
  new Schema<TOpeningBalanceLine>(
    {
      account: {
        type: Schema.Types.ObjectId,
        ref: 'AccountingAccount',
        required: true,
      },
      debit: { type: Number, required: true, min: 0 },
      credit: { type: Number, required: true, min: 0 },
      description: {
        type: String,
        trim: true,
        maxlength: 240,
      },
      counterparty: {
        type: String,
        trim: true,
        maxlength: 160,
      },
      due_date: { type: Date },
    },
    { _id: false }
  );

const OpeningBalanceSchema = new Schema<TOpeningBalance>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      select: false,
    },
    opening_balance_number: {
      type: String,
      required: true,
    },
    effective_date: { type: Date, required: true },
    period: { type: String, required: true },
    currency: {
      type: String,
      required: true,
      default: 'IDR',
    },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'posted', 'reversed'],
      default: 'draft',
    },
    journal_entry: {
      type: Schema.Types.ObjectId,
      ref: 'JournalEntry',
    },
    lines: {
      type: [OpeningBalanceLineMongooseSchema],
      required: true,
      validate: {
        validator: (lines: TOpeningBalanceLine[]) =>
          lines.length >= 2,
        message:
          'Opening balance minimal memiliki dua line.',
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

OpeningBalanceSchema.pre(
  'validate',
  function (this: TOpeningBalance) {
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
          'Total debit dan credit opening balance harus sama.'
        );
      }
    }
  }
);

OpeningBalanceSchema.index(
  { organization: 1, opening_balance_number: 1 },
  { unique: true }
);
OpeningBalanceSchema.plugin(multiTenancyPlugin);

export const OpeningBalanceModel =
  models.OpeningBalance ||
  model<TOpeningBalance>(
    'OpeningBalance',
    OpeningBalanceSchema,
    'accounting_opening_balances'
  );
