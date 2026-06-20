import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Alamat email tidak valid'),
  password: z
    .string()
    .min(8, 'Kata sandi harus terdiri minimal 8 karakter.'),
});

export type LoginInput = z.infer<typeof LoginSchema>;
