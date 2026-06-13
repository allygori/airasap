import { Schema, model, models, Document } from 'mongoose';

const ObjectId = Schema.Types.ObjectId;

export type TFile = Document & {
  filename: string;
  original_name: string;
  mime_type: string;
  file_type: 'xlsx' | 'image' | 'docs' | 'ppt' | 'other';
  size: number;
  url: string;
  alt_text?: string;
  caption?: string;
  credits?: string;
  checksum?: string;
  storage_provider:
    | 'cloudflare-r2'
    | 'vercel-blob'
    | 'aws-s3'
    | 'local';
  storage_path?: string;
  uploaded_by?: typeof ObjectId;
  deleted_at?: Date;
};

const FileSchema = new Schema<TFile>(
  {
    filename: {
      type: String,
      unique: true,
      required: true,
    },
    original_name: {
      type: String,
      required: true,
      alias: 'originalName',
    },
    mime_type: {
      type: String,
      required: true,
      alias: 'mimeType',
    },
    file_type: {
      type: String,
      enum: ['xlsx', 'image', 'docs', 'ppt', 'other'],
      required: true,
      alias: 'fileType',
    },
    size: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    alt_text: {
      type: String,
      alias: 'altText',
    },
    caption: {
      type: String,
    },
    credits: {
      type: String,
    },
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
      alias: 'storageProvider',
    },
    storage_path: {
      type: String,
      alias: 'storagePath',
    },
    uploaded_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      alias: 'uploadedBy',
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

export const FileModel =
  models.File || model<TFile>('File', FileSchema, 'files');
