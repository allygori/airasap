import { z } from 'zod';
import { PLATFORMS } from '@/lib/db/constant';

export const createProductSchema = z.object({
  store: z.string().min(1, 'Store wajib diisi.'),
  platform: z.enum(PLATFORMS as [string, ...string[]], {
    message: 'Platform tidak valid.',
  }),
  name: z
    .string()
    .min(1, 'Nama produk wajib diisi.')
    .max(100, 'Nama produk maksimal 100 karakter.'),
  product_key: z.string().optional(),
  variation_name: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const updateProductSchema =
  createProductSchema.partial();

export type CreateProductInput = z.infer<
  typeof createProductSchema
>;
export type UpdateProductInput = z.infer<
  typeof updateProductSchema
>;
