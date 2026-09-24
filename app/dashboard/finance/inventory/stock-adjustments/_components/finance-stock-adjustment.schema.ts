import { z } from 'zod';
import type {
  FinanceInventoryAdjustmentItemOptionDTO,
  FinanceInventoryAdjustmentLocationOptionDTO,
} from '@/modules/finance/client';

export const createFinanceStockAdjustmentFormSchema = (
  items: readonly FinanceInventoryAdjustmentItemOptionDTO[],
  locations: readonly FinanceInventoryAdjustmentLocationOptionDTO[]
) =>
  z
    .object({
      item_id: z.string().min(1, 'Pilih item inventory.'),
      location_id: z.string().min(1, 'Pilih lokasi.'),
      direction: z.enum(['increase', 'decrease']),
      reason: z.enum([
        'stock_count',
        'damage',
        'loss',
        'other',
      ]),
      quantity: z
        .string()
        .regex(
          /^\d+$/,
          'Masukkan quantity dalam angka bulat.'
        )
        .refine(
          (value) =>
            Number(value) > 0 && Number(value) <= 1_000_000,
          'Quantity harus antara 1 dan 1.000.000.'
        ),
      unit_cost: z
        .string()
        .regex(
          /^\d*$/,
          'Masukkan unit cost dalam angka bulat.'
        )
        .refine(
          (value) =>
            value === '' ||
            (Number(value) > 0 &&
              Number(value) <= 1_000_000_000_000),
          'Unit cost harus lebih besar dari 0 dan tidak melebihi batas.'
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
      notes: z
        .string()
        .max(500, 'Catatan maksimal 500 karakter.'),
    })
    .superRefine((values, context) => {
      const selectedItem = items.find(
        (item) => item.id === values.item_id
      );
      if (!selectedItem) {
        context.addIssue({
          code: 'custom',
          path: ['item_id'],
          message: 'Pilih item inventory yang tersedia.',
        });
      } else if (
        selectedItem.track_value &&
        !values.unit_cost
      ) {
        context.addIssue({
          code: 'custom',
          path: ['unit_cost'],
          message:
            'Unit cost wajib untuk item yang melacak nilai.',
        });
      }

      if (
        !locations.some(
          (location) => location.id === values.location_id
        )
      ) {
        context.addIssue({
          code: 'custom',
          path: ['location_id'],
          message: 'Pilih lokasi inventory yang tersedia.',
        });
      }

      if (
        values.direction === 'increase' &&
        (values.reason === 'damage' ||
          values.reason === 'loss')
      ) {
        context.addIssue({
          code: 'custom',
          path: ['direction'],
          message:
            'Kerusakan atau kehilangan harus mengurangi stok.',
        });
      }
    });

export type FinanceStockAdjustmentFormValues = z.input<
  ReturnType<typeof createFinanceStockAdjustmentFormSchema>
>;
