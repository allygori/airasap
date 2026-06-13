import { Schema, model, models, Document } from 'mongoose';

export type TVerification = Document & {
  identifier?: string;
  value?: string;
  expires_at?: Date;
  deleted_at?: Date;
};

const VerificationSchema = new Schema<TVerification>(
  {
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

export const VerificationModel =
  models.Verification ||
  model<TVerification>(
    'Verification',
    VerificationSchema,
    'verifications'
  );
