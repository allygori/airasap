import { Schema, model, models } from 'mongoose';

const AccountSchema = new Schema(
  {
    // better-auth fields
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      alias: 'userId',
    },
    // providerId: text("provider_id").notNull(),
    access_token: {
      type: String,
      alias: 'accessToken',
    },
    refresh_token: {
      type: String,
      alias: 'refreshToken',
    },
    id_token: {
      type: String,
      alias: 'idToken',
    },
    access_token_expires_at: {
      type: Date,
      alias: 'accessTokenExpiresAt',
    },
    refresh_token_expires_at: {
      type: Date,
      alias: 'refreshTokenExpiresAt',
    },
    scope: {
      type: String,
    },
    password: {
      type: String,
    },

    // Custom fields
    deleted_at: { type: Date }, // soft delete
  },
  {
    timestamps: {
      createdAt: 'created_at', // Use `created_at` to store the created date
      updatedAt: 'updated_at', // and `updated_at` to store the last updated date
    },
  }
);

const Account =
  models.Account ||
  model('Account', AccountSchema, 'accounts');

export default Account;
