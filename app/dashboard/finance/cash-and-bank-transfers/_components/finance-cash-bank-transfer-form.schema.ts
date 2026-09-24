import { z } from 'zod';

export const FinanceCashBankTransferFormSchema = z
  .object({
    source_account_id: z
      .string()
      .min(1, 'Pilih akun sumber.'),
    destination_account_id: z
      .string()
      .min(1, 'Pilih akun tujuan.'),
    amount: z
      .string()
      .regex(/^\d+$/, 'Masukkan nominal dalam angka bulat.')
      .refine(
        (value) =>
          Number.isSafeInteger(Number(value)) &&
          Number(value) > 0 &&
          Number(value) <= 1_000_000_000_000_000,
        'Nominal harus lebih dari 0 dan tidak melebihi batas.'
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
          Number.isFinite(date.getTime()) &&
          date.toISOString().slice(0, 10) === value
        );
      }, 'Tanggal transaksi tidak valid.'),
    reference: z.string().max(120),
    description: z.string().max(500),
  })
  .refine(
    (values) =>
      values.source_account_id !==
      values.destination_account_id,
    {
      path: ['destination_account_id'],
      message: 'Akun sumber dan tujuan harus berbeda.',
    }
  );

export type FinanceCashBankTransferFormValues = z.input<
  typeof FinanceCashBankTransferFormSchema
>;
