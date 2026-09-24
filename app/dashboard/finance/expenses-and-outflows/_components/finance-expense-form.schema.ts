import { z } from 'zod';

export const FinanceExpenseFormSchema = z
  .object({
    category_account_id: z
      .string()
      .min(1, 'Pilih kategori expense.'),
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
    expense_date: z
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
    description: z
      .string()
      .trim()
      .min(1, 'Masukkan deskripsi expense.')
      .max(500),
    vendor_name: z.string().max(160),
    reference: z.string().max(120),
    payment_timing: z.enum(['paid', 'payable']),
    payment_account_id: z.string(),
    notes: z.string().max(500),
    attachment_reference: z.string().max(200),
  })
  .superRefine((values, context) => {
    if (
      values.payment_timing === 'paid' &&
      !values.payment_account_id
    ) {
      context.addIssue({
        code: 'custom',
        path: ['payment_account_id'],
        message: 'Pilih akun Kas/Bank untuk pembayaran.',
      });
    }
  });

export type FinanceExpenseFormValues = z.input<
  typeof FinanceExpenseFormSchema
>;
