import { z } from 'zod';

export const ZodOnboardingSchema = z.object({
  logo: z.string(),
  name: z.string().min(5, 'Nama organisasi wajib diisi.'),
  slug: z.string(),
  firstStore: z
    .string()
    .min(5, 'Nama toko pertama wajib diisi.'),
  description: z.string(),
});

export type ZodOnboardingInput = z.infer<
  typeof ZodOnboardingSchema
>;
