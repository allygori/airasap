import { z } from 'zod';
import { ORDER_PLATFORM_VALUES } from '@/constant/order-platform';
import { TIMEZONE_VALUES } from '@/constant/timezone';

export const BaseStoreSchema = z.object({
  platform: z.enum(ORDER_PLATFORM_VALUES),
  name: z.string().min(1, 'Nama toko wajib diisi'),
  timezone: z.enum(TIMEZONE_VALUES),
  is_active: z.boolean().default(true),
});

/**
 * Skema untuk pembuatan store baru (POST)
 */
export const CreateStoreSchema = BaseStoreSchema.omit({
  is_active: true,
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
