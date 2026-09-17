import { Schema, model, models, Document } from 'mongoose';
import { OrganizationBaseDTO } from './organization.dto';
import { ORGANIZATION_ACCOUNTING_STATUS_VALUES } from './organization.schema';

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
    deletedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
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
    accounting: {
      status: {
        type: String,
        enum: ORGANIZATION_ACCOUNTING_STATUS_VALUES,
        default: 'not_started',
      },
      onboarding_version: {
        type: Number,
        default: 1,
      },
      calendar_timezone: {
        type: String,
      },
      cutover_date: {
        type: Date,
      },
      account_mappings: {
        type: Schema.Types.Mixed,
      },
      started_at: {
        type: Date,
      },
      completed_at: {
        type: Date,
      },
      completed_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    // username: {
    //   type: String,
    // },
    deletedAt: {
      type: Date,
      // alias: 'deletedAt',
    },
  }
  // {
  //   timestamps: {
  //     createdAt: 'created_at',
  //     updatedAt: 'updated_at',
  //   },
  // }
);

export const OrganizationModel =
  models.Organization ||
  model<TOrganization>(
    'Organization',
    OrganizationSchema,
    'organizations'
  );
