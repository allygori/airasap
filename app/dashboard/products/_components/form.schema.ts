import z from 'zod';

export const productCostHistorySchema = z.object({
  effective_from: z.coerce.date(),
  cogs_unit: z.number().int().nonnegative(),
  notes: z.string().nullable().optional(),
});

export const variantSchema = z.object({
  variant_id: z.string().min(1, 'Variant ID wajib diisi'),
  name: z.string().min(1, 'Nama variant wajib diisi'),
  price: z.number().min(0, 'Harga tidak boleh minus'),
  discount: z.number().int().min(0).max(100).default(0),
  final_price: z.number().min(0).optional(),
  parent_sku: z.string().optional(),
  sku: z.string().optional(),
  gtin: z.string().optional(),
  is_default: z.boolean().default(false),
  costs: z
    .array(productCostHistorySchema)
    .optional()
    .default([]),
});

export const formSchema = z.object({
  id: z.string().optional(),
  platform: z.string().min(1, 'Platform wajib diisi'),
  name: z.string().min(1, 'Nama produk wajib diisi'),
  product_id: z.string().min(1, 'Product ID wajib diisi'),
  variants: z.array(variantSchema).optional().default([]),
});
