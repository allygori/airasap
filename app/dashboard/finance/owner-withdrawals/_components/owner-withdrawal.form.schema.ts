import { z } from 'zod';

export const FinanceOwnerWithdrawalFormSchema = z.object({
  owner_account_id: z
    .string()
    .min(1, 'Pilih akun pemilik yang mengambil dana.'),
  payment_account_id: z
    .string()
    .min(1, 'Pilih sumber Kas atau Bank.'),
  amount: z
    .string()
    .regex(/^\d+$/, 'Masukkan nominal dalam angka bulat.')
    .refine(
      (value) =>
        Number(value) > 0 &&
        Number.isSafeInteger(Number(value)) &&
        Number(value) <= 1_000_000_000_000_000,
      'Nominal harus lebih dari 0 dan dalam batas yang aman.'
    ),
  transaction_date: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'Pilih tanggal transaksi.'
    )
    .refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    }, 'Tanggal transaksi tidak valid.'),
  description: z.string().max(500),
  reference: z.string().max(120),
});

export type FinanceOwnerWithdrawalFormValues = z.input<
  typeof FinanceOwnerWithdrawalFormSchema
>;
