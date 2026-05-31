import { z } from 'zod';

export const ZodLoginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .optional()
    .or(z.literal('')),
});

export type ZodLoginInput = z.infer<typeof ZodLoginSchema>;
