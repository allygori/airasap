import { Schema, model, models, Document } from 'mongoose';

export type TUser = Document & {
  name?: string;
  email: string;
  image?: string;
  email_verified: boolean;
  created_at: Date;
  updated_at?: Date;
  deleted_at?: Date;
};

const UserSchema = new Schema<TUser>(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      type: String,
    },
    email_verified: {
      type: Boolean,
      default: false,
      alias: 'emailVerified',
    },
    // created_at: {
    //   type: Date,
    //   default: Date.now,
    // },
    // updated_at: {
    //   type: Date,
    // },
    deleted_at: {
      type: Date,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

export const UserModel =
  models.User || model<TUser>('User', UserSchema, 'users');
