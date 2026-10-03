import { z } from 'zod';

export const UpdateOrganizationProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(
        2,
        'Nama organisasi harus terdiri minimal 2 karakter.'
      )
      .max(100, 'Nama organisasi maksimal 100 karakter.'),
  })
  .strict();

export type UpdateOrganizationProfileInput = z.infer<
  typeof UpdateOrganizationProfileSchema
>;
