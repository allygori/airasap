import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import {
  FINANCE_ACCOUNT_TYPE_VALUES,
  FINANCE_NORMAL_BALANCE_VALUES,
  type FinanceAccountType,
  type FinanceNormalBalance,
} from './finance-account.constants';

export type TFinanceAccount = Document & {
  organization: Types.ObjectId;
  code: string;
  name: string;
  type: FinanceAccountType;
  subtype?: string;
  parent_account?: Types.ObjectId | null;
  normal_balance: FinanceNormalBalance;
  is_system: boolean;
  is_postable: boolean;
  is_active: boolean;
  display_order: number;
  description?: string;
  account_metadata?: {
    institution?: string;
    account_last4?: string;
    account_holder?: string;
    provider?: string;
  };
  created_at?: Date;
  updated_at?: Date;
};

const FinanceAccountSchema = new Schema<TFinanceAccount>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      select: false,
    },
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: FINANCE_ACCOUNT_TYPE_VALUES,
      required: true,
    },
    subtype: { type: String },
    parent_account: {
      type: Schema.Types.ObjectId,
      ref: 'FinanceChartAccount',
      default: null,
    },
    normal_balance: {
      type: String,
      enum: FINANCE_NORMAL_BALANCE_VALUES,
      required: true,
    },
    is_system: { type: Boolean, default: false },
    is_postable: { type: Boolean, default: true },
    is_active: { type: Boolean, default: true },
    display_order: { type: Number, default: 0 },
    description: { type: String },
    account_metadata: {
      institution: { type: String },
      account_last4: { type: String, match: /^\d{4}$/ },
      account_holder: { type: String },
      provider: { type: String },
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

FinanceAccountSchema.index(
  { organization: 1, code: 1 },
  { unique: true }
);
FinanceAccountSchema.index({
  organization: 1,
  parent_account: 1,
  display_order: 1,
});

FinanceAccountSchema.plugin(multiTenancyPlugin);

export const FinanceAccountModel =
  models.FinanceChartAccount ||
  model<TFinanceAccount>(
    'FinanceChartAccount',
    FinanceAccountSchema,
    'finance_accounts'
  );
