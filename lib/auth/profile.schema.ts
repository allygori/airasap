import { z } from 'zod';

export const UpdateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Nama harus terdiri minimal 2 karakter.')
      .max(100, 'Nama maksimal 100 karakter.'),
  })
  .strict();

export type UpdateProfileInput = z.infer<
  typeof UpdateProfileSchema
>;
