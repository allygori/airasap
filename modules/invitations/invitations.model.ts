import { Schema, model, models, Document } from 'mongoose';

const ObjectId = Schema.Types.ObjectId;

export type TInvitation = Document & {
  organization: typeof ObjectId;
  email: string;
  role?: string;
  status?: string;
  expires_at?: Date;
  inviter: typeof ObjectId;
  deleted_at?: Date;
};

const InvitationSchema = new Schema<TInvitation>(
  {
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
    inviter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      alias: 'inviterId',
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

export const InvitationModel =
  models.Invitation ||
  model<TInvitation>(
    'Invitation',
    InvitationSchema,
    'invitations'
  );
