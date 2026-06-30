import {
  Schema,
  model,
  models,
  Document,
  Types,
} from 'mongoose';
import { BaseAccountDTO } from './account.dto';

export type TAccount = Document &
  BaseAccountDTO & {
    deleted_at?: Date | null;
    created_at?: Date;
    updated_at?: Date;
  };

// export type TAccount = Document & {
//   user: typeof ObjectId;
//   access_token?: string;
//   refresh_token?: string;
//   id_token?: string;
//   access_token_expires_at?: Date;
//   refresh_token_expires_at?: Date;
//   scope?: string;
//   password?: string;
//   deleted_at?: Date;
// };

const AccountSchema = new Schema<TAccount>(
  {
    // account: {
    //   type: Types.ObjectId,
    //   required: true,
    //   unique: true,
    //   alias: 'accountId',
    // },
    user: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
      // index: true,
      alias: 'userId',
    },
    provider: {
      type: String,
    },
    password: {
      type: String,
    },

    // access_token: {
    //   type: String,
    //   alias: 'accessToken',
    // },
    // refresh_token: {
    //   type: String,
    //   alias: 'refreshToken',
    // },
    // id_token: {
    //   type: String,
    //   alias: 'idToken',
    // },
    // access_token_expires_at: {
    //   type: Date,
    //   alias: 'accessTokenExpiresAt',
    // },
    // refresh_token_expires_at: {
    //   type: Date,
    //   alias: 'refreshTokenExpiresAt',
    // },
    // scope: {
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

export const AccountModel =
  models.Account ||
  model<TAccount>('Account', AccountSchema, 'accounts');
