import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import {
  FINANCE_PERIOD_STATUS_VALUES,
  type FinancePeriodStatus,
} from './finance-period.constants';

export type TFinancePeriod = Document & {
  organization: Types.ObjectId;
  period_key: string;
  start_date: Date;
  end_date: Date;
  status: FinancePeriodStatus;
  closed_at?: Date;
  closed_by?: Types.ObjectId;
  created_at?: Date;
  updated_at?: Date;
};

const FinancePeriodSchema = new Schema<TFinancePeriod>(
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
      enum: FINANCE_PERIOD_STATUS_VALUES,
      required: true,
      default: 'open',
    },
    closed_at: { type: Date },
    closed_by: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

FinancePeriodSchema.index(
  { organization: 1, period_key: 1 },
  { unique: true }
);
FinancePeriodSchema.plugin(multiTenancyPlugin);

export const FinancePeriodModel =
  models.FinancePeriod ||
  model<TFinancePeriod>(
    'FinancePeriod',
    FinancePeriodSchema,
    'finance_accounting_periods'
  );
