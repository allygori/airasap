import { z } from 'zod';

export const ZodRegisterSchema = z.object({
  name: z
    .string()
    .min(2, 'Nama harus terdiri minimal 2 karakter.'),
  email: z.string().email('Alamat email tidak valid'),
  password: z
    .string()
    .min(8, 'Kata sandi harus terdiri minimal 8 karakter.'),
  // confirmPassword: z
  //   .string()
  //   .min(8, 'Kata sandi harus terdiri minimal 8 karakter.'),
});
// .refine(
//   (data) => data.password === data.confirmPassword,
//   {
//     message: 'Passwords do not match',
//     path: ['confirmPassword'],
//   }
// );

export type ZodRegisterInput = z.infer<
  typeof ZodRegisterSchema
>;
