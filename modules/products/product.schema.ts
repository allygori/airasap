import { z } from 'zod';
// import mongoose from 'mongoose';
// import { Types } from 'mongoose';
import { ORDER_PLATFORM_VALUES } from '@/constant/order-platform';

// const ObjectIdSchema = z.union([
//   z.instanceof(Types.ObjectId),
//   z
//     .string()
//     .regex(/^[0-9a-fA-F]{24}$/)
//     .transform((val) => new Types.ObjectId(val)),
// ]);

export const VariantSchema = z.object({
  variant_id: z.string().min(1, 'Variant ID wajib diisi'),
  name: z.string().min(1, 'Nama variant wajib diisi'),
  // key: z.string().min(1, 'Variant key wajib diisi'),
  price: z
    .number()
    .positive('Harga variant harus lebih besar dari 0'),
  // quantity: z
  //   .number()
  //   .int()
  //   .nonnegative('Jumlah tidak boleh minus')
  //   .default(0),
  discount: z
    .number()
    .int()
    .min(0, 'Diskon tidak boleh minus')
    .max(100, 'Diskon maksimal 100%')
    .default(0),
  final_price: z.number().nonnegative().optional(),
  parent_sku: z.string().optional(),
  sku: z.string().optional(),
  gtin: z.string().optional(),
  is_default: z.boolean(), // https://share.google/aimode/LIpXWTeE9qAGrqCxZ
  costs: z
    .array(
      z.object({
        // effective_from: z.coerce.date(),
        cogs_unit: z.number().int().nonnegative(),
        notes: z.string().nullable().optional(),
      })
    )
    .optional()
    .default([]),
  default_cost: z.number().optional(),
  // product_cost: ObjectIdSchema,
  // product_cost: z
  //   .string()
  //   .optional()
  //   .refine((val) => mongoose.isValidObjectId(val), {
  //     message: 'Mongoose ObjectId tidak valid',
  //   })
  //   .transform((val) => new mongoose.Types.ObjectId(val)),
});

export const ProductBaseSchema = z.object({
  platform: z
    .enum(ORDER_PLATFORM_VALUES, 'Platform tidak valid')
    .optional(),
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  product_id: z.string().min(1, 'Product ID wajib diisi'),
  // key: z.string().optional(),
  // options: z.array(
  //   z.object({
  //     name: z.string(),
  //     values: z.array(z.string()),
  //   })
  // ).optional().default([]),
  options: z
    .array(z.array(z.string()))
    .optional()
    .default([]),
  variants: z.array(VariantSchema).optional(),
  // total_options: z.number().int().optional().default(0),
  // total_variant: z.number().int().optional().default(0),
  is_active: z.boolean().default(true),
});

export const CreateProductSchema = ProductBaseSchema;

export const UpdateProductSchema =
  ProductBaseSchema.partial();

export const ProductResponseSchema =
  ProductBaseSchema.extend({
    _id: z.string(),
    id: z.string(),
    // organization: z.string().optional(),
    // store: z.string().optional(),
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
  populate: z.string().optional(),
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
  // platform: z.string().min(1, 'Platform tidak valid'),
  platform: z.enum(
    ORDER_PLATFORM_VALUES,
    'Params "Platform" tidak valid'
  ),
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
});
