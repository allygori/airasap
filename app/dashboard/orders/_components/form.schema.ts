import z from 'zod';

export const variantSchema = z.object({
  variation_id: z.number().optional(),
  name: z.string().min(1, 'Variant name is required'),
  price: z.number().min(0, 'Price must be positive'),
  quantity: z.number().default(0),
  discount: z.number().default(0),
  finalPrice: z.number().optional(),
  SKU: z.string().optional(),
  GTIN: z.string().optional(),
});

export const formSchema = z.object({
  id: z.string().optional(),
  platform: z.string().min(1, 'Platform is required'),
  name: z.string().min(1, 'Name is required'),
  product_id: z.number().optional(),
  variants: z.array(variantSchema).optional(),
});
