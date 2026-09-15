import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import { AccountBaseDTO } from './account.dto';

export type TAccountingAccount = Document &
  Omit<AccountBaseDTO, 'parent_account'> & {
    organization: Types.ObjectId;
    parent_account?: Types.ObjectId | null;
    created_at?: Date;
    updated_at?: Date;
  };

const AccountSchema = new Schema<TAccountingAccount>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      select: false,
    },
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true },
    subtype: { type: String },
    parent_account: {
      type: Schema.Types.ObjectId,
      ref: 'AccountingAccount',
      default: null,
    },
    normal_balance: {
      type: String,
      enum: ['debit', 'credit'],
      required: true,
    },
    is_system: { type: Boolean, default: false },
    is_postable: { type: Boolean, default: true },
    is_active: { type: Boolean, default: true },
    display_order: { type: Number, default: 0 },
    description: { type: String },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

AccountSchema.index(
  { organization: 1, code: 1 },
  { unique: true }
);
AccountSchema.index({
  organization: 1,
  parent_account: 1,
  display_order: 1,
});

AccountSchema.plugin(multiTenancyPlugin);

export const AccountingAccountModel =
  models.AccountingAccount ||
  model<TAccountingAccount>(
    'AccountingAccount',
    AccountSchema,
    'accounting_accounts'
  );
