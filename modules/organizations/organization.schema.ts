import z from 'zod';

export const OrganizationBaseSchema = z.object({
  name: z.string().min(1, 'Nama organisasi wajib diisi'),
  slug: z.string().min(1, 'Slug organisasi wajib diisi'),
  logo: z.string().optional(),
  metadata: z.object().optional(),
  plan: z.string().optional().default('free'),
  // user: z
  //   .string()
  //   .optional()
  //   .refine((val) => mongoose.isValidObjectId(val), {
  //     message: 'Mongoose ObjectId tidak valid',
  //   })
  //   .transform((val) => new mongoose.Types.ObjectId(val)),
});

export const OrganizationSchema =
  OrganizationBaseSchema.extend({
    _id: z
      .string()
      .optional()
      .refine((val) => mongoose.isValidObjectId(val), {
        message: 'Mongoose ObjectId tidak valid',
      })
      .transform((val) => new mongoose.Types.ObjectId(val)),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    deleted_at: z.string().nullable().optional(),
  });

export const OrganizationResponseSchema =
  OrganizationSchema;
