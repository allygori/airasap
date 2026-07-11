import { Schema, model, models, Document } from 'mongoose';

const ObjectId = Schema.Types.ObjectId;

export type TInvitation = Document & {
  organizationId: typeof ObjectId;
  email: string;
  role?: string;
  status?: string;
  expiresAt?: Date;
  inviter: typeof ObjectId;
  deletedAt?: Date;
};

const InvitationSchema = new Schema<TInvitation>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
      // alias: 'organizationId',
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
    expiresAt: {
      type: Date,
      // alias: 'expiresAt',
    },
    inviter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      alias: 'inviterId',
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

export const InvitationModel =
  models.Invitation ||
  model<TInvitation>(
    'Invitation',
    InvitationSchema,
    'invitations'
  );
