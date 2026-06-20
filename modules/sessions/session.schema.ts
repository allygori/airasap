import z from 'zod';

export const SessionBaseSchema = z.object({
  active_organization: z
    .string()
    .optional()
    .refine((val) => mongoose.isValidObjectId(val), {
      message: 'Mongoose ObjectId tidak valid',
    })
    .transform((val) => new mongoose.Types.ObjectId(val)),
  user: z
    .string()
    .optional()
    .refine((val) => mongoose.isValidObjectId(val), {
      message: 'Mongoose ObjectId tidak valid',
    })
    .transform((val) => new mongoose.Types.ObjectId(val)),
  token: z.string(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  expires_at: z.string().optional(),
});

export const SessionSchema = SessionBaseSchema.extend({
  _id: z
    .string()
    .optional()
    .refine((val) => mongoose.isValidObjectId(val), {
      message: 'Mongoose ObjectId tidak valid',
    })
    .transform((val) => new mongoose.Types.ObjectId(val)),
  active_store: z
    .string()
    .optional()
    .refine((val) => mongoose.isValidObjectId(val), {
      message: 'Mongoose ObjectId tidak valid',
    })
    .transform((val) => new mongoose.Types.ObjectId(val)),
  theme: z.string().optional(),
  language: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  deleted_at: z.string().nullable().optional(),
});

// export const GetLatestOrgAndStoreResponseSchema = z.object({
//   activeOrganizationId: z.string(),
//   activeStoreId: z.string(),
// });

export const SessionResponseSchema = SessionSchema;
