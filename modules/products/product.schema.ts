import { z } from 'zod';
import { PLATFORMS } from '../constant';

const platforms = [...PLATFORMS] as const;

export const VariantSchema = z.object({
  variant_id: z.string().min(1, 'Variant ID wajib diisi'),
  name: z.string().min(1, 'Nama variant wajib diisi'),
  key: z.string().min(1, 'Variant key wajib diisi'),
  price: z
    .number()
    .positive('Harga variant harus lebih besar dari 0'),
  quantity: z
    .number()
    .int()
    .nonnegative('Jumlah tidak boleh minus')
    .default(0),
  discount: z
    .number()
    .int()
    .min(0, 'Diskon tidak boleh minus')
    .max(100, 'Diskon maksimal 100%')
    .default(0),
  final_price: z
    .number()
    .positive('Final price harus lebih besar dari 0'),
  parent_sku: z.string().optional(),
  sku: z.string().optional(),
  gtin: z.string().optional(),
});

export const ProductBaseSchema = z.object({
  platform: z.enum(platforms, 'Platform tidak valid'),
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  product_id: z.string().min(1, 'Product ID wajib diisi'),
  key: z.string().optional(),
  variants: z.array(VariantSchema).optional(),
  is_active: z.boolean().default(true),
});

export const CreateProductSchema = ProductBaseSchema;

export const UpdateProductSchema =
  ProductBaseSchema.partial();

export const ProductResponseSchema =
  ProductBaseSchema.extend({
    _id: z.string(),
    organization: z.string().optional(),
    store: z.string().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    deleted_at: z.string().nullable().optional(),
  });

export const ProductFilterSchema = z.object({
  platform: z.string().optional(),
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

export const ProductSearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query wajib diisi'),
});

export const ProductIdParamsSchema = z.object({
  id: z.string().min(1, 'Product ID tidak valid'),
});

export const ProductPlatformParamsSchema = z.object({
  platform: z.string().min(1, 'Platform tidak valid'),
});

export const BulkUpdateStatusSchema = z.object({
  product_ids: z
    .array(z.string())
    .min(1, 'Minimal satu produk dipilih'),
  is_active: z.boolean(),
});

export const MassUploadResponseSchema = z.object({
  created_count: z.number(),
  updated_count: z.number(),
  total_rows: z.number(),
  total_products: z.number(),
  // createdCount: number;
  // updatedCount: number;
  // totalRows: number;
  // totalProducts: number;
});

// import { z } from 'zod';

// /**
//  * Schema untuk Variant dalam produk
//  */
// export const VariantSchema = z.object({
//   variant_id: z.string().min(1, 'Variant ID wajib diisi'),
//   name: z.string().min(1, 'Nama variant wajib diisi'),
//   key: z.string().min(1, 'Variant key wajib diisi'),
//   price: z
//     .number()
//     .positive('Harga variant harus lebih besar dari 0'),
//   // quantity: z
//   //   .number()
//   //   .int()
//   //   .nonnegative('Jumlah tidak boleh minus'),
//   discount: z
//     .number()
//     .int()
//     .min(0, 'Diskon tidak boleh minus')
//     .max(100, 'Diskon maksimal 100%')
//     .default(0),
//   final_price: z
//     .number()
//     .positive('Final price harus lebih besar dari 0'),
//   parent_sku: z.string().optional(),
//   sku: z.string().optional(),
//   gtin: z.string().optional(),
// });

// /**
//  * Skema untuk produk
//  */
// export const ProductSchema = z.object({
//   platform: z.string().min(1, 'Platform wajib diisi'),
//   name: z.string().min(3, 'Nama minimal 3 karakter'),
//   product_id: z.string().min(1, 'Product ID wajib diisi'),
//   key: z.string().optional(),
//   variants: z.array(VariantSchema).optional(),
//   is_active: z.boolean().default(true),
// });
