import { Schema, model, models, Document } from 'mongoose';

export type TVerification = Document & {
  identifier?: string;
  value?: string;
  expiresAt?: Date;
  deletedAt?: Date;
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
    expiresAt: {
      type: Date,
      // alias: 'expiresAt',
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

export const VerificationModel =
  models.Verification ||
  model<TVerification>(
    'Verification',
    VerificationSchema,
    'verifications'
  );
