import { z } from 'zod';

const ObjectIdStringSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'ObjectId tidak valid');

const SupplierFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama supplier wajib diisi.')
    .max(160),
  contact_name: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z
    .string()
    .trim()
    .max(160)
    .email('Format email tidak valid.')
    .or(z.literal(''))
    .optional(),
  address: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const FinanceSupplierCreateInputSchema =
  SupplierFieldsSchema.strict();

export const FinanceSupplierUpdateInputSchema =
  SupplierFieldsSchema.partial()
    .extend({ is_active: z.boolean().optional() })
    .strict()
    .refine((value) => Object.keys(value).length > 0, {
      message:
        'Pilih setidaknya satu informasi supplier untuk diubah.',
    });

export const FinanceSupplierListQuerySchema = z
  .object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .max(1000)
      .default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(25),
    search: z.string().trim().max(100).optional(),
    status: z
      .enum(['all', 'active', 'inactive'])
      .default('all'),
  })
  .strict();

export const FinanceSupplierResponseSchema = z.object({
  supplier_id: ObjectIdStringSchema,
  name: z.string().min(1),
  contact_name: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  notes: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const FinanceSupplierListResponseSchema = z.object({
  suppliers: z.array(FinanceSupplierResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
});

export const FinanceSupplierMutationResponseSchema =
  z.object({
    supplier: FinanceSupplierResponseSchema,
  });
