import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import {
  FINANCE_OPENING_BALANCE_MODE_VALUES,
  FINANCE_OPENING_BALANCE_STATUS_VALUES,
  type FinanceOpeningBalanceMode,
  type FinanceOpeningBalanceStatus,
} from './finance-opening-balance.constants';

type TOpeningAccountAmount = {
  account_id: Types.ObjectId;
  amount: number;
};

type TOpeningInventoryLine = {
  inventory_item_id: Types.ObjectId;
  location_id: Types.ObjectId;
  quantity: number;
  unit_cost?: number;
};

type TOpeningSubledgerLine = {
  account_id: Types.ObjectId;
  amount: number;
  counterparty?: string;
  reference?: string;
};

export type TFinanceOpeningBalanceDraft = Document & {
  organization: Types.ObjectId;
  onboarding_version: number;
  status: FinanceOpeningBalanceStatus;
  cut_off_date: Date;
  mode: FinanceOpeningBalanceMode;
  description: string;
  cash_bank_lines: TOpeningAccountAmount[];
  inventory_lines: TOpeningInventoryLine[];
  payable_lines: TOpeningSubledgerLine[];
  receivable_lines: TOpeningSubledgerLine[];
  owner_capital_account_id?: Types.ObjectId;
  owner_capital_amount?: number;
  journal_entry?: Types.ObjectId | null;
  inventory_movement_ids: Types.ObjectId[];
  finalized_at?: Date | null;
  finalized_by?: Types.ObjectId | null;
  created_at?: Date;
  updated_at?: Date;
};

const OpeningAccountAmountMongooseSchema =
  new Schema<TOpeningAccountAmount>(
    {
      account_id: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      amount: { type: Number, required: true, min: 0 },
    },
    { _id: false }
  );

const OpeningInventoryLineMongooseSchema =
  new Schema<TOpeningInventoryLine>(
    {
      inventory_item_id: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      location_id: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      quantity: { type: Number, required: true, min: 0 },
      unit_cost: { type: Number, min: 0 },
    },
    { _id: false }
  );

const OpeningSubledgerLineMongooseSchema =
  new Schema<TOpeningSubledgerLine>(
    {
      account_id: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      amount: { type: Number, required: true, min: 0 },
      counterparty: {
        type: String,
        trim: true,
        maxlength: 160,
      },
      reference: {
        type: String,
        trim: true,
        maxlength: 160,
      },
    },
    { _id: false }
  );

const FinanceOpeningBalanceDraftSchema =
  new Schema<TFinanceOpeningBalanceDraft>(
    {
      organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        select: false,
      },
      onboarding_version: { type: Number, required: true },
      status: {
        type: String,
        enum: FINANCE_OPENING_BALANCE_STATUS_VALUES,
        default: 'draft',
        required: true,
      },
      cut_off_date: { type: Date, required: true },
      mode: {
        type: String,
        enum: FINANCE_OPENING_BALANCE_MODE_VALUES,
        required: true,
      },
      description: {
        type: String,
        required: true,
        trim: true,
      },
      cash_bank_lines: {
        type: [OpeningAccountAmountMongooseSchema],
        default: [],
      },
      inventory_lines: {
        type: [OpeningInventoryLineMongooseSchema],
        default: [],
      },
      payable_lines: {
        type: [OpeningSubledgerLineMongooseSchema],
        default: [],
      },
      receivable_lines: {
        type: [OpeningSubledgerLineMongooseSchema],
        default: [],
      },
      owner_capital_account_id: {
        type: Schema.Types.ObjectId,
      },
      owner_capital_amount: { type: Number, min: 0 },
      journal_entry: {
        type: Schema.Types.ObjectId,
        ref: 'FinanceJournalEntry',
        default: null,
      },
      inventory_movement_ids: {
        type: [Schema.Types.ObjectId],
        default: [],
      },
      finalized_at: { type: Date, default: null },
      finalized_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
    },
    {
      timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    }
  );

FinanceOpeningBalanceDraftSchema.index(
  { organization: 1, onboarding_version: 1 },
  { unique: true }
);
FinanceOpeningBalanceDraftSchema.plugin(multiTenancyPlugin);

const registeredModel = models.FinanceOpeningBalanceDraft;
const registeredStatusEnum =
  registeredModel?.schema.path('status')?.options.enum;
const registeredStatusValues = Array.isArray(
  registeredStatusEnum
)
  ? registeredStatusEnum.filter(
      (value): value is string => typeof value === 'string'
    )
  : [];

if (
  registeredModel &&
  FINANCE_OPENING_BALANCE_STATUS_VALUES.some(
    (value) => !registeredStatusValues.includes(value)
  )
) {
  delete models.FinanceOpeningBalanceDraft;
}

export const FinanceOpeningBalanceDraftModel =
  models.FinanceOpeningBalanceDraft ||
  model<TFinanceOpeningBalanceDraft>(
    'FinanceOpeningBalanceDraft',
    FinanceOpeningBalanceDraftSchema,
    'finance_opening_balance_drafts'
  );
