import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import { AccountingPeriodBaseDTO } from './accounting-period.dto';

export type TAccountingPeriod = Document &
  Omit<
    AccountingPeriodBaseDTO,
    'start_date' | 'end_date' | 'closed_at' | 'closed_by'
  > & {
    organization: Types.ObjectId;
    start_date: Date;
    end_date: Date;
    closed_at?: Date;
    closed_by?: Types.ObjectId;
    created_at?: Date;
    updated_at?: Date;
  };

const AccountingPeriodSchema =
  new Schema<TAccountingPeriod>(
    {
      organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        select: false,
      },
      period_key: { type: String, required: true },
      start_date: { type: Date, required: true },
      end_date: { type: Date, required: true },
      status: {
        type: String,
        enum: ['open', 'closed'],
        default: 'open',
      },
      closed_at: { type: Date },
      closed_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    {
      timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    }
  );

AccountingPeriodSchema.index(
  { organization: 1, period_key: 1 },
  { unique: true }
);
AccountingPeriodSchema.plugin(multiTenancyPlugin);

export const AccountingPeriodModel =
  models.AccountingPeriod ||
  model<TAccountingPeriod>(
    'AccountingPeriod',
    AccountingPeriodSchema,
    'accounting_periods'
  );
