import { z } from 'zod';

const isValidDateOnly = (value: string) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
};

export const OwnerWithdrawalFilterFormSchema = z.object({
  from_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(isValidDateOnly, 'Tanggal awal tidak valid.'),
  to_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(isValidDateOnly, 'Tanggal akhir tidak valid.'),
  owner_account_id: z.string(),
});

export type OwnerWithdrawalFilterFormValues = z.input<
  typeof OwnerWithdrawalFilterFormSchema
>;
