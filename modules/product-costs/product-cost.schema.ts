import { z } from 'zod';
import { Types } from 'mongoose';

export const ObjectIdSchema = z.union([
  z.instanceof(Types.ObjectId),
  z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .transform((val) => new Types.ObjectId(val)),
]);

export const BaseProductCostSchema = z.object({
  // product: z
  //   .string()
  //   .optional()
  //   .refine(
  //     (val) =>
  //       mongoose.Types.ObjectId.isValid(val as string),
  //     {
  //       message: 'Mongoose ObjectId tidak valid',
  //     }
  //   )
  //   .transform((val) => new mongoose.Types.ObjectId(val)),
  // product: z.string(),
  product: ObjectIdSchema,
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

export const ProductCostResponseSchema =
  BaseProductCostSchema.extend({
    _id: z.string(),
    organization: z.string().optional(),
    store: z.string().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    deleted_at: z.string().nullable().optional(),
  });
