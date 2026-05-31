import { Schema, model, models } from 'mongoose';

const SessionSchema = new Schema(
  {
    // better-auth fields
    active_organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      alias: 'activeOrganizationId',
    },
    user: {
      type: Schema.Types.ObjectId,
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
    deleted_at: { type: Date }, // soft delete
  },
  {
    timestamps: {
      createdAt: 'created_at', // Use `created_at` to store the created date
      updatedAt: 'updated_at', // and `updated_at` to store the last updated date
    },
  }
);

const Session =
  models.Session ||
  model('Session', SessionSchema, 'sessions');

export default Session;
