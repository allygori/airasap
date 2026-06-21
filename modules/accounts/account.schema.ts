import z from 'zod';

export const BaseAccountSchema = z.object({
  account_id: z
    .string()
    .refine((val) => mongoose.isValidObjectId(val), {
      message: 'Mongoose ObjectId tidak valid',
    })
    .transform((val) => new mongoose.Types.ObjectId(val)),
  user: z
    .string()
    .refine((val) => mongoose.isValidObjectId(val), {
      message: 'Mongoose ObjectId tidak valid',
    })
    .transform((val) => new mongoose.Types.ObjectId(val)),
  provider: z.string(),
  password: z.string(),
});

export const CreateAccountSchema = BaseAccountSchema;

export const UpdateAccountSchema =
  CreateAccountSchema.partial();
