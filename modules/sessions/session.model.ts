import {
  Schema,
  model,
  models,
  Document,
  Types,
} from 'mongoose';
import { SessionDTO } from './session.dto';

// const ObjectId = Schema.Types.ObjectId;

// export type TSession = Document & {
//   active_organization: typeof ObjectId;
//   user: typeof ObjectId;
//   token: string;
//   ip_address?: string;
//   user_agent?: string;
//   expires_at?: Date;
//   theme?: string;
//   language?: string;
//   active_store: typeof ObjectId;
//   deleted_at?: Date;
// };

export type TSession = Document &
  SessionDTO & {
    active_store: Types.ObjectId;
    theme?: string;
    language?: string;
    deleted_at?: Date | null;
    created_at?: Date;
    updated_at?: Date;
  };

const SessionSchema = new Schema<TSession>(
  {
    active_organization: {
      type: Types.ObjectId,
      ref: 'Organization',
      required: true,
      alias: 'activeOrganizationId',
    },
    user: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      alias: 'userId',
    },
    token: {
      type: String,
      unique: true,
    },
    ip_address: {
      type: String,
      alias: 'ipAddress',
    },
    user_agent: {
      type: String,
      alias: 'userAgent',
    },
    expires_at: {
      type: Date,
      alias: 'expiresAt',
    },

    // Custom fields
    active_store: {
      type: Types.ObjectId,
      ref: 'Store',
      required: true,
      alias: 'activeStoreId',
    },
    theme: {
      type: String,
    },
    language: {
      type: String,
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

export const SessionModel =
  models.Session ||
  model<TSession>('Session', SessionSchema, 'sessions');
