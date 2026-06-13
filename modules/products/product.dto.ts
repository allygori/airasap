import { z } from 'zod';

/**
 * Schema untuk Variant dalam produk
 */
export const VariantSchema = z.object({
  variant_id: z.string().min(1, 'Variant ID wajib diisi'),
  name: z.string().min(1, 'Nama variant wajib diisi'),
  product_key: z.string().min(1, 'Product key wajib diisi'),
  price: z
    .number()
    .positive('Harga variant harus lebih besar dari 0'),
  quantity: z
    .number()
    .int()
    .nonnegative('Jumlah tidak boleh minus'),
  discount: z
    .number()
    .int()
    .min(0, 'Diskon tidak boleh minus')
    .max(100, 'Diskon maksimal 100%')
    .default(0),
  finalPrice: z
    .number()
    .positive('Final price harus lebih besar dari 0'),
  SKU: z.string().optional(),
  GTIN: z.string().optional(),
});

/**
 * Skema untuk pembuatan produk baru (POST)
 */
export const CreateProductSchema = z.object({
  platform: z.string().min(1, 'Platform wajib diisi'),
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  product_id: z.string().min(1, 'Product ID wajib diisi'),
  key: z.string().optional(),
  variants: z.array(VariantSchema).optional(),
  is_active: z.boolean().default(true),
});

/**
 * Skema untuk pembaruan produk (PATCH/PUT) - Semua field opsional
 */
export const UpdateProductSchema =
  CreateProductSchema.partial();

/**
 * Skema untuk bulk update status produk
 */
export const BulkUpdateStatusSchema = z.object({
  product_ids: z
    .array(z.string())
    .min(1, 'Minimal satu produk dipilih'),
  is_active: z.boolean(),
});

/**
 * Skema untuk query filter
 */
export const ProductFilterSchema = z.object({
  platform: z.string().optional(),
  is_active: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(10),
});

/**
 * Inferred TypeScript types dari Zod
 */
export type VariantDTO = z.infer<typeof VariantSchema>;
export type CreateProductDTO = z.infer<
  typeof CreateProductSchema
>;
export type UpdateProductDTO = z.infer<
  typeof UpdateProductSchema
>;
export type BulkUpdateStatusDTO = z.infer<
  typeof BulkUpdateStatusSchema
>;
export type ProductFilterDTO = z.infer<
  typeof ProductFilterSchema
>;
