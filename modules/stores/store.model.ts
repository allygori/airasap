import {
  Schema,
  model,
  models,
  Document,
  Types,
} from 'mongoose';
import { TIMEZONE_VALUES } from '@/constant/timezone';
import { StoreBaseDTO } from './store.dto';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';

export type TStore = Document &
  StoreBaseDTO & {
    organization: Types.ObjectId;
    deleted_at?: Date | null;
    created_at?: Date;
    updated_at?: Date;
  };

const StoreSchema = new Schema<TStore>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      alias: 'organizationId',
    },
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      // required: true,
    },
    timezone: {
      type: String,
      enum: TIMEZONE_VALUES,
      required: false,
      default: 'Asia/Jakarta',
    },
    is_active: {
      type: Boolean,
      default: true,
      alias: 'isActive',
    },

    deleted_at: {
      type: Date,
      alias: 'deletedAt',
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

StoreSchema.plugin(multiTenancyPlugin);

export const StoreModel =
  models.Store ||
  model<TStore>('Store', StoreSchema, 'stores');
