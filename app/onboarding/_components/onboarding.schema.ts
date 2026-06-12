import { z } from 'zod';

export const ZodOnboardingSchema = z.object({
  logo: z.string(),
  name: z
    .string()
    .min(2, 'Nama harus terdiri minimal 2 karakter.'),
  slug: z.string(),
  description: z.string(),
});

export type ZodOnboardingInput = z.infer<
  typeof ZodOnboardingSchema
>;
