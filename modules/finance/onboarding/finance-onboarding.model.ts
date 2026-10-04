import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import {
  TIMEZONE_VALUES,
  type TimeZone,
} from '@/constant/timezone';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import { FINANCE_STATUS_VALUES } from './finance-onboarding.schema';

export type TFinanceOnboarding = Document & {
  organization: Types.ObjectId;
  lifecycle: {
    status: (typeof FINANCE_STATUS_VALUES)[number];
    onboarding_version: number;
    started_at?: Date;
    blocked_reason?: string;
    cut_off_date?: Date;
    completed_at?: Date;
    completed_by?: Types.ObjectId;
  };
  settings: {
    calendar_timezone: TimeZone;
  };
  created_at?: Date;
  updated_at?: Date;
};

const FinanceOnboardingSchema =
  new Schema<TFinanceOnboarding>(
    {
      organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        select: false,
      },
      lifecycle: {
        status: {
          type: String,
          enum: FINANCE_STATUS_VALUES,
          default: 'not_started',
        },
        onboarding_version: {
          type: Number,
          min: 1,
          default: 1,
        },
        started_at: { type: Date },
        blocked_reason: { type: String },
        cut_off_date: { type: Date },
        completed_at: { type: Date },
        completed_by: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
      },
      settings: {
        calendar_timezone: {
          type: String,
          enum: TIMEZONE_VALUES,
          default: 'Asia/Jakarta',
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

FinanceOnboardingSchema.index(
  { organization: 1 },
  { unique: true }
);
FinanceOnboardingSchema.plugin(multiTenancyPlugin);

export const FinanceOnboardingModel =
  models.FinanceOnboarding ||
  model<TFinanceOnboarding>(
    'FinanceOnboarding',
    FinanceOnboardingSchema,
    'finance_onboarding_states'
  );
