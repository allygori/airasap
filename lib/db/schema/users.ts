import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
  {
    // better-auth fields
    name: { type: String },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    email_verified: {
      type: Boolean,
      default: false,
      alias: 'emailVerified',
    },
    // Custom fields
    // role: {
    //   type: String,
    //   enum: ['owner', 'admin'],
    //   default: 'owner',
    // },
    // username: { type: String },
    deleted_at: { type: Date }, // soft delete
  },
  {
    timestamps: {
      createdAt: 'created_at', // Use `created_at` to store the created date
      updatedAt: 'updated_at', // and `updated_at` to store the last updated date
    },
  }
);

const User =
  models.User || model('User', UserSchema, 'users');

export default User;
