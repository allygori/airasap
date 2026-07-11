import z from 'zod';

export const SessionBaseSchema = z.object({
  activeOrganizationId: z
    .string()
    .optional()
    .refine((val) => mongoose.isValidObjectId(val), {
      message: 'Mongoose ObjectId tidak valid',
    })
    .transform((val) => new mongoose.Types.ObjectId(val)),
  userId: z
    .string()
    .optional()
    .refine((val) => mongoose.isValidObjectId(val), {
      message: 'Mongoose ObjectId tidak valid',
    })
    .transform((val) => new mongoose.Types.ObjectId(val)),
  token: z.string(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  expiresAt: z.string().optional(),
});

export const SessionSchema = SessionBaseSchema.extend({
  _id: z
    .string()
    .optional()
    .refine((val) => mongoose.isValidObjectId(val), {
      message: 'Mongoose ObjectId tidak valid',
    })
    .transform((val) => new mongoose.Types.ObjectId(val)),
  activeStoreId: z
    .string()
    .optional()
    .refine((val) => mongoose.isValidObjectId(val), {
      message: 'Mongoose ObjectId tidak valid',
    })
    .transform((val) => new mongoose.Types.ObjectId(val)),
  theme: z.string().optional(),
  language: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
});

// export const GetLatestOrgAndStoreResponseSchema = z.object({
//   activeOrganizationId: z.string(),
//   activeStoreId: z.string(),
// });

export const SessionResponseSchema = SessionSchema;
