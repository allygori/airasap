import { Schema, model, models } from 'mongoose';
import { PLATFORMS } from '../constant';

const StoreSchema = new Schema(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    platform: {
      type: String,
      enum: PLATFORMS,
      required: true,
    },
    name: { type: String, required: true },
    is_active: { type: Boolean, default: true },

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

const Store =
  models.Store || model('Store', StoreSchema, 'Stores');

export default Store;
