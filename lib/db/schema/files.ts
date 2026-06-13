import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      unique: true,
      required: true,
    },
    original_name: { type: String, required: true },
    mime_type: { type: String, required: true },
    file_type: {
      type: String,
      enum: ['xlsx', 'image', 'docs', 'ppt', 'other'],
      required: true,
    },
    size: { type: Number, required: true }, // in bytes
    url: { type: String, required: true }, // Cloudflare R2/Vercel Blob/AWS S3 URL
    alt_text: { type: String },
    caption: { type: String },
    credits: { type: String },
    // folder: { type: String }, // optional organization
    checksum: {
      type: String,
      index: true,
    },
    storage_provider: {
      type: String,
      enum: [
        'cloudflare-r2',
        'vercel-blob',
        'aws-s3',
        'local',
      ],
      default: 'local',
    },
    storage_path: {
      type: String,
    },
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deleted_at: { type: Date }, // soft delete
  },
  {
    timestamps: {
      createdAt: 'created_at', // Use `created_at` to store the created date
      updatedAt: 'updated_at', // and `updated_at` to store the last updated date
    },
  } // Automatically handles createdAt and updatedAt
);

export default mongoose.models.File ||
  mongoose.model('File', FileSchema);
