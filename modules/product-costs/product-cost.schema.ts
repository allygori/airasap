import { z } from 'zod';

export const BaseProductCostSchema = z.object({
  product: z
    .string()
    .optional()
    .refine((val) => mongoose.isValidObjectId(val), {
      message: 'Mongoose ObjectId tidak valid',
    })
    .transform((val) => new mongoose.Types.ObjectId(val)),
  // effective_from: z.iso.datetime(),
  // effective_from: z.string(),
  effective_from: z.coerce.date(),
  cogs_unit: z.number().int(),
  notes: z.string().nullable().optional(),
});

export const CreateProductCostSchema =
  BaseProductCostSchema;

export const UpdateProductCostSchema =
  CreateProductCostSchema.partial();

export const QueryFilterProductCostSchema = z.object({
  effective_from: z.string().optional(),
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
