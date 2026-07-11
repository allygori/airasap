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
    activeStoreId: Types.ObjectId;
    theme?: string;
    language?: string;
    deletedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
  };

const SessionSchema = new Schema<TSession>(
  {
    activeOrganizationId: {
      type: Types.ObjectId,
      ref: 'Organization',
      required: true,
      // alias: 'activeOrganizationId',
    },
    userId: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      // alias: 'userId',
    },
    token: {
      type: String,
      unique: true,
    },
    ipAddress: {
      type: String,
      // alias: 'ipAddress',
    },
    userAgent: {
      type: String,
      // alias: 'userAgent',
    },
    expiresAt: {
      type: Date,
      // alias: 'expiresAt',
    },

    // Custom fields
    activeStoreId: {
      type: Types.ObjectId,
      ref: 'Store',
      required: true,
      // alias: 'activeStoreId',
    },
    theme: {
      type: String,
    },
    language: {
      type: String,
    },

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

export const SessionModel =
  models.Session ||
  model<TSession>('Session', SessionSchema, 'sessions');
