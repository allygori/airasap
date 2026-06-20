import { Schema, model, models, Document } from 'mongoose';
import { OrganizationBaseDTO } from './organization.dto';

// export type TOrganization = Document & {
//   name?: string;
//   slug?: string;
//   logo?: string;
//   metadata?: Record<string, string | null>;
//   plan: 'free' | 'pro' | 'plus' | 'enterprise';
//   username?: string;
//   deleted_at?: Date;
// };

export type TOrganization = Document &
  OrganizationBaseDTO & {
    deleted_at?: Date | null;
    created_at?: Date;
    updated_at?: Date;
  };

const OrganizationSchema = new Schema<TOrganization>(
  {
    name: {
      type: String,
    },
    slug: {
      type: String,
      unique: true,
    },
    logo: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    // user: {
    //   type: Types.ObjectId,
    //   ref: 'User',
    //   required: true,
    //   index: true,
    //   alias: 'userId',
    // },

    // additional fields
    plan: {
      type: String,
      enum: ['free', 'pro', 'plus', 'enterprise'],
      default: 'free',
    },
    // username: {
    //   type: String,
    // },
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

export const OrganizationModel =
  models.Organization ||
  model<TOrganization>(
    'Organization',
    OrganizationSchema,
    'organizations'
  );
