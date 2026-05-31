import { Schema, model, models } from 'mongoose';

const InvitationSchema = new Schema(
  {
    // better-auth fields
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
      alias: 'organizationId',
    },
    email: {
      type: String,
      index: true,
    },
    role: {
      type: String,
    },
    status: {
      type: String,
    },
    expires_at: {
      type: Date,
      alias: 'expiresAt',
    },
    inviter_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      alias: 'inviterId',
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

const Invitation =
  models.Invitation ||
  model('Invitation', InvitationSchema, 'invitations');

export default Invitation;
