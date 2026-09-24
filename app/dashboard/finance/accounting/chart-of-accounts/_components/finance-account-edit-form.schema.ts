import { z } from 'zod';

export const FinanceAccountEditFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama akun wajib diisi.')
    .max(120, 'Nama akun maksimal 120 karakter.'),
  description: z
    .string()
    .max(500, 'Deskripsi maksimal 500 karakter.'),
});

export type FinanceAccountEditFormValues = z.input<
  typeof FinanceAccountEditFormSchema
>;
