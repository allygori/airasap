import { z } from 'zod';

// Skema utama / dasar untuk Product
export const productBaseSchema = z.object({
  name: z
    .string()
    .min(3, 'Nama produk minimal 3 karakter.')
    .max(100),
  price: z.coerce
    .number()
    .positive('Harga harus lebih besar dari 0.'),
  stock: z.coerce
    .number()
    .int()
    .nonnegative('Stok tidak boleh negatif.'),
  description: z
    .string()
    .max(500)
    .optional()
    .or(z.literal('')),
});

// Skema spesifik untuk Create (bisa sama dengan base)
export const createProductSchema = productBaseSchema;

// Skema spesifik untuk Update (id wajib, field lain opsional/bisa diubah)
export const updateProductSchema = productBaseSchema
  .partial()
  .extend({
    id: z.string().uuid('ID produk tidak valid.'),
  });

// Inferensi tipe data untuk TypeScript otomatis
export type ProductBase = z.infer<typeof productBaseSchema>;

// types
export type CreateProductInput = z.infer<
  typeof createProductSchema
>;
export type UpdateProductInput = z.infer<
  typeof updateProductSchema
>;

// // Infer type directly from the schema
// export type LoginInput = z.infer<typeof loginSchema>;
