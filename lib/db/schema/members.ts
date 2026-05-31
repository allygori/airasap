import { Schema, model, models } from 'mongoose';

const MemberSchema = new Schema(
  {
    // better-auth fields
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

const Member =
  models.Member || model('Member', MemberSchema, 'members');

export default Member;
