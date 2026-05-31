import { z } from 'zod';

export const ZodForgotPasswordSchema = z.object({
  email: z.email('Invalid email address'),
});

export type ZodForgotPasswordInput = z.infer<
  typeof ZodForgotPasswordSchema
>;
