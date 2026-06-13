import { Schema, model, models, Document } from 'mongoose';
import { PLATFORMS } from '../constant';

const ObjectId = Schema.Types.ObjectId;
const platforms = [...PLATFORMS] as const;

export type TStore = Document & {
  organization: typeof ObjectId;
  user: typeof ObjectId;
  platform: (typeof platforms)[number];
  name: string;
  is_active: boolean;
  deleted_at?: Date;
};

const StoreSchema = new Schema<TStore>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      alias: 'organizationId',
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      alias: 'userId',
    },
    platform: {
      type: String,
      enum: PLATFORMS,
      required: true,
    },
    name: {
      type: String,
      required: true,
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

export const StoreModel =
  models.Store ||
  model<TStore>('Store', StoreSchema, 'Stores');
