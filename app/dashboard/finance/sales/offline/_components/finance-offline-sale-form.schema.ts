import { z } from 'zod';
import type { FinanceOfflineSaleFormOptionsDTO } from '@/modules/finance/client';

const OfflineSaleLineSchema = z.object({
  line_key: z.string().min(1),
  product_key: z.string().min(1, 'Pilih produk.'),
  quantity: z
    .string()
    .regex(/^\d+$/, 'Masukkan jumlah dalam angka bulat.')
    .refine(
      (value) =>
        Number.isSafeInteger(Number(value)) &&
        Number(value) > 0 &&
        Number(value) <= 100_000,
      'Jumlah harus antara 1 dan 100.000.'
    ),
  unit_price: z
    .string()
    .regex(/^\d+$/, 'Masukkan harga dalam angka bulat.')
    .refine(
      (value) =>
        Number.isSafeInteger(Number(value)) &&
        Number(value) > 0 &&
        Number(value) <= 1_000_000_000_000,
      'Harga harus lebih dari 0 dan tidak melebihi batas.'
    ),
});

export const createFinanceOfflineSaleFormSchema = (
  options: FinanceOfflineSaleFormOptionsDTO
) =>
  z
    .object({
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
      payment_account_id: z
        .string()
        .min(1, 'Pilih akun penerimaan.'),
      reference: z.string().max(100),
      lines: z
        .array(OfflineSaleLineSchema)
        .min(1, 'Tambahkan minimal satu produk.')
        .max(50, 'Penjualan maksimal berisi 50 produk.'),
    })
    .superRefine((values, context) => {
      const selectedProducts = new Map(
        options.products.map((product) => [
          product.key,
          product,
        ])
      );
      const quantityByProduct = new Map<string, number>();
      let total = 0;

      values.lines.forEach((line, index) => {
        const product = selectedProducts.get(
          line.product_key
        );
        if (!product) {
          context.addIssue({
            code: 'custom',
            path: ['lines', index, 'product_key'],
            message:
              'Produk tidak tersedia untuk penjualan.',
          });
          return;
        }

        const quantity = Number(line.quantity);
        const cumulativeQuantity =
          (quantityByProduct.get(product.key) ?? 0) +
          quantity;
        quantityByProduct.set(
          product.key,
          cumulativeQuantity
        );

        if (
          cumulativeQuantity > product.available_quantity
        ) {
          context.addIssue({
            code: 'custom',
            path: ['lines', index, 'quantity'],
            message: `Jumlah melebihi stok tersedia (${product.available_quantity} ${product.unit}).`,
          });
        }

        total += quantity * Number(line.unit_price);
      });

      if (!Number.isSafeInteger(total)) {
        context.addIssue({
          code: 'custom',
          path: ['lines'],
          message:
            'Total penjualan melebihi batas nominal yang aman.',
        });
      }
    });

export type FinanceOfflineSaleFormValues = z.input<
  ReturnType<typeof createFinanceOfflineSaleFormSchema>
>;
