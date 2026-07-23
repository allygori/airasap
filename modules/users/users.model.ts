import {
  type TimeZone,
  TIMEZONE_VALUES,
} from '@/constant/timezone';
import { Schema, model, models, Document } from 'mongoose';

export type TUser = Document & {
  name?: string;
  email: string;
  image?: string;
  email_verified: boolean;
  timezone?: TimeZone;
  is_onboarded?: boolean;
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
    timezone: {
      type: String,
      enum: TIMEZONE_VALUES,
      required: false,
      default: 'Asia/Jakarta',
    },
    is_onboarded: {
      type: Boolean,
      required: false,
      default: false,
    },
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
