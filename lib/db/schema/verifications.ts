import { Schema, model, models } from 'mongoose';

const VerificationSchema = new Schema(
  {
    // better-auth fields
    identifier: {
      type: String,
      index: true,
    },
    value: {
      type: String,
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

const Verification =
  models.Verification ||
  model(
    'Verification',
    VerificationSchema,
    'verifications'
  );

export default Verification;
