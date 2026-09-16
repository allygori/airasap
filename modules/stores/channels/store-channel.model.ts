import {
  Document,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';
import { multiTenancyPlugin } from '@/lib/db/plugins/multi-tenancy';
import { StoreChannelBaseDTO } from './store-channel.dto';

export type TStoreChannel = Document &
  Omit<StoreChannelBaseDTO, 'store'> & {
    organization: Types.ObjectId;
    store: Types.ObjectId;
    created_at?: Date;
    updated_at?: Date;
  };

const StoreChannelSchema = new Schema<TStoreChannel>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      select: false,
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    platform: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    external_account_id: { type: String, trim: true },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

StoreChannelSchema.index({
  organization: 1,
  store: 1,
  platform: 1,
  is_active: 1,
});
StoreChannelSchema.index({
  organization: 1,
  external_account_id: 1,
});
StoreChannelSchema.plugin(multiTenancyPlugin);

export const StoreChannelModel =
  models.StoreChannel ||
  model<TStoreChannel>(
    'StoreChannel',
    StoreChannelSchema,
    'store_channel_connections'
  );
