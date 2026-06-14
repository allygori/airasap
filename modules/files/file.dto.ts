import { z } from 'zod';
import {
  FILE_TYPES,
  STORAGE_PROVIDERS,
} from './file.constant';

// /**
//  * Schema untuk Variant dalam produk
//  */
// export const VariantSchema = z.object({
//   filename: z.string().min(1, 'Filename wajib diisi'),
//   original_name: z
//     .string()
//     .min(1, 'Original name wajib diisi'),
//   mime_type: z.string().min(1, 'MIME Type wajib diisi'),
//   file_type: z.enum(FILE_TYPES),
//   size: z
//     .number()
//     .positive('Ukuran file harus lebih besar dari 0'),
//   url: z.string().min(1, 'URL wajib diisi'),
//   alt_text: z.string().optional(),
//   caption: z.string().optional(),
//   credits: z.string().optional(),
//   checksum: z.string().min(1, 'Checksum wajib diisi'),
//   storage_provider: z.enum(STORAGE_PROVIDERS),
//   storage_path: z.string().optional(),
//   uploaded_by: z.string().optional(),
// });

/**
 * Skema untuk pembuatan file baru (POST)
 */
export const CreateFileSchema = z.object({
  filename: z.string().min(1, 'Filename wajib diisi'),
  original_name: z
    .string()
    .min(1, 'Original name wajib diisi'),
  mime_type: z.string().min(1, 'MIME Type wajib diisi'),
  file_type: z.enum(FILE_TYPES),
  size: z
    .number()
    .positive('Ukuran file harus lebih besar dari 0'),
  url: z.string().min(1, 'URL wajib diisi'),
  alt_text: z.string().optional(),
  caption: z.string().optional(),
  credits: z.string().optional(),
  checksum: z.string().min(1, 'Checksum wajib diisi'),
  storage_provider: z.enum(STORAGE_PROVIDERS),
  storage_path: z.string().optional(),
  uploaded_by: z.string().optional(),
});

/**
 * Skema untuk pembaruan file (PATCH/PUT) - Semua field opsional
 */
export const UpdateFileSchema = CreateFileSchema.partial();

/**
 * Skema untuk query filter
 */
export const FileFilterSchema = z.object({
  fileType: z.enum(FILE_TYPES).optional(),
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

/**
 * Inferred TypeScript types dari Zod
 */
export type CreateFileDTO = z.infer<
  typeof CreateFileSchema
>;
export type UpdateFileDTO = z.infer<
  typeof UpdateFileSchema
>;
export type FileFilterDTO = z.infer<
  typeof FileFilterSchema
>;
