import { z } from 'zod';
import { PLATFORMS } from '../constant';

/**
 * Skema untuk pembuatan store baru (POST)
 */
export const CreateStoreSchema = z.object({
  // organization: z.string().min(1, 'Organisasi wajib diisi'),
  // user: z.string().min(1, 'Original name wajib diisi'),
  platform: z.enum(PLATFORMS),
  name: z.string().min(1, 'Nama toko wajib diisi'),
});

/**
 * Skema untuk pembaruan store (PATCH/PUT) - Semua field opsional
 */
export const UpdateStoreSchema =
  CreateStoreSchema.partial();

/**
 * Skema untuk query filter
 */
export const StoreFilterSchema = z.object({
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
export type CreateStoreDTO = z.infer<
  typeof CreateStoreSchema
>;
export type UpdateStoreDTO = z.infer<
  typeof UpdateStoreSchema
>;
export type StoreFilterDTO = z.infer<
  typeof StoreFilterSchema
>;
