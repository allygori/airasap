import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';

export type TFinanceSupplier = Document & {
  organization: Types.ObjectId;
  name: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
};

const FinanceSupplierSchema = new Schema<TFinanceSupplier>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    contact_name: {
      type: String,
      default: null,
      trim: true,
      maxlength: 120,
    },
    phone: {
      type: String,
      default: null,
      trim: true,
      maxlength: 40,
    },
    email: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
      maxlength: 160,
    },
    address: {
      type: String,
      default: null,
      trim: true,
      maxlength: 300,
    },
    notes: {
      type: String,
      default: null,
      trim: true,
      maxlength: 500,
    },
    is_active: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

FinanceSupplierSchema.index({
  organization: 1,
  is_active: 1,
  name: 1,
});
FinanceSupplierSchema.plugin(multiTenancyPlugin);

export const FinanceSupplierModel =
  models.FinanceSupplier ||
  model<TFinanceSupplier>(
    'FinanceSupplier',
    FinanceSupplierSchema,
    'finance_suppliers'
  );
