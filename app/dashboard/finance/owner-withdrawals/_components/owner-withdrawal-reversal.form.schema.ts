import { z } from 'zod';

export const OwnerWithdrawalReversalFormSchema = z.object({
  effective_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    }, 'Pilih tanggal pembalikan yang valid.'),
  reason: z
    .string()
    .trim()
    .min(3, 'Jelaskan alasan pembalikan.')
    .max(300, 'Alasan maksimal 300 karakter.'),
});

export type OwnerWithdrawalReversalFormValues = z.input<
  typeof OwnerWithdrawalReversalFormSchema
>;
