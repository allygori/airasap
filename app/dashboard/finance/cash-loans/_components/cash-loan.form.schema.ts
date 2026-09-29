import { z } from 'zod';

export const CashLoanFormSchema = z
  .object({
    event_type: z.enum(['received', 'repayment']),
    lender_type: z.enum([
      'owner',
      'bank',
      'digital_lender',
      'other',
    ]),
    lender_name: z.string().trim().max(150),
    owner_account_id: z.string(),
    lender_key: z.string(),
    payment_account_id: z
      .string()
      .min(
        1,
        'Pilih rekening usaha penerima atau pembayar.'
      ),
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
  })
  .superRefine((value, context) => {
    if (value.event_type === 'received') {
      if (
        value.lender_type === 'owner' &&
        !value.owner_account_id
      ) {
        context.addIssue({
          code: 'custom',
          path: ['owner_account_id'],
          message: 'Pilih pemilik pemberi pinjaman.',
        });
      }
      if (
        value.lender_type !== 'owner' &&
        !value.lender_name.trim()
      ) {
        context.addIssue({
          code: 'custom',
          path: ['lender_name'],
          message: 'Masukkan nama pemberi pinjaman.',
        });
      }
    } else if (!value.lender_key) {
      context.addIssue({
        code: 'custom',
        path: ['lender_key'],
        message: 'Pilih pinjaman yang akan dibayar.',
      });
    }
  });

export type CashLoanFormValues = z.input<
  typeof CashLoanFormSchema
>;
