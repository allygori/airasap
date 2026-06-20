import { Schema, model, models, Document } from 'mongoose';

const ObjectId = Schema.Types.ObjectId;

export type TMember = Document & {
  organization: typeof ObjectId;
  user: typeof ObjectId;
  role: 'owner' | 'admin';
  deleted_at?: Date;
};

const MemberSchema = new Schema<TMember>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
      alias: 'organizationId',
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      alias: 'userId',
    },
    role: {
      type: String,
      enum: ['owner', 'admin'],
      default: 'owner',
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

export const MemberModel =
  models.Member ||
  model<TMember>('Member', MemberSchema, 'members');
