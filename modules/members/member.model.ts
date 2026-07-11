import { Schema, model, models, Document } from 'mongoose';

const ObjectId = Schema.Types.ObjectId;

export type TMember = Document & {
  organizationId: typeof ObjectId;
  userId: typeof ObjectId;
  role: 'owner' | 'admin';
  deletedAt: Date;
};

const MemberSchema = new Schema<TMember>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      // index: true,
      // alias: 'organizationId',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      // index: true,
      // alias: 'userId',
    },
    // organization: {
    //   type: String,
    //   required: true,
    // },

    role: {
      type: String,
      enum: ['owner', 'admin'],
      default: 'owner',
    },

    // additional fields
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

export const MemberModel =
  models.Member ||
  model<TMember>('Member', MemberSchema, 'members');
