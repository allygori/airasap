import z from 'zod';
import {
  FILE_TYPES_KV,
  STORAGE_PROVIDERS_KV,
} from './file.constant';

/**
 * Base file schema
 */
export const BaseFileSchema = z.object({
  filename: z.string().min(1, 'Filename wajib diisi'),
  original_name: z
    .string()
    .min(1, 'Original name wajib diisi'),
  mime_type: z.string().min(1, 'MIME Type wajib diisi'),
  file_type: z.enum(Object.values(FILE_TYPES_KV)),
  size: z
    .number()
    .positive('Ukuran file harus lebih besar dari 0'),
  url: z.string().min(1, 'URL wajib diisi'),
  alt_text: z.string().optional(),
  caption: z.string().optional(),
  credits: z.string().optional(),
  checksum: z.string().min(1, 'Checksum wajib diisi'),
  storage_provider: z.enum(
    Object.values(STORAGE_PROVIDERS_KV)
  ),
  storage_path: z.string().optional(),
  uploaded_by: z.string().optional(),
});

/**
 * Create file schema
 */
export const CreateFileSchema = BaseFileSchema;

/**
 * Update file schema - All fields are optional
 */
export const UpdateFileSchema = CreateFileSchema.partial();

/**
 * Query filter file schema
 */
export const QueryFilterFileSchema = z.object({
  fileType: z.enum(Object.values(FILE_TYPES_KV)).optional(),
  is_active: z.preprocess((value) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  }, z.boolean().optional()),
  search: z.string().optional(),
  page: z.preprocess((value) => {
    if (typeof value === 'string' && value.length) {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    }
    return value;
  }, z.number().int().positive().optional().default(1)),
  limit: z.preprocess((value) => {
    if (typeof value === 'string' && value.length) {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    }
    return value;
  }, z.number().int().positive().optional().default(10)),
});
