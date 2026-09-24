import { z } from 'zod';
import { FinanceInventoryItemTypeSchema } from '@/modules/finance/client';

export const FinanceInventoryProductSetupFormSchema = z
  .object({
    mode: z.enum(['create', 'existing']),
    sku: z.string().max(80),
    name: z.string().max(160),
    unit: z.string().max(40),
    inventory_item_id: z.string(),
    track_quantity: z.boolean(),
    track_value: z.boolean(),
  })
  .superRefine((values, context) => {
    if (values.mode === 'existing') {
      if (!values.inventory_item_id) {
        context.addIssue({
          code: 'custom',
          path: ['inventory_item_id'],
          message: 'Pilih item stok yang akan digunakan.',
        });
      }
      return;
    }

    if (!values.sku.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['sku'],
        message: 'SKU wajib diisi.',
      });
    }
    if (!values.name.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['name'],
        message: 'Nama item wajib diisi.',
      });
    }
    if (!values.unit.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['unit'],
        message: 'Satuan wajib diisi.',
      });
    }
    if (values.track_value && !values.track_quantity) {
      context.addIssue({
        code: 'custom',
        path: ['track_value'],
        message:
          'Pelacakan nilai memerlukan pelacakan jumlah stok.',
      });
    }
  });

export const FinanceInventoryManualItemFormSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .min(1, 'SKU wajib diisi.')
      .max(80),
    name: z
      .string()
      .trim()
      .min(1, 'Nama item wajib diisi.')
      .max(160),
    item_type: FinanceInventoryItemTypeSchema,
    unit: z
      .string()
      .trim()
      .min(1, 'Satuan wajib diisi.')
      .max(40),
    track_quantity: z.boolean(),
    track_value: z.boolean(),
  })
  .superRefine((values, context) => {
    if (values.track_value && !values.track_quantity) {
      context.addIssue({
        code: 'custom',
        path: ['track_value'],
        message:
          'Pelacakan nilai memerlukan pelacakan jumlah stok.',
      });
    }
  });

export type FinanceInventoryProductSetupFormValues =
  z.input<typeof FinanceInventoryProductSetupFormSchema>;

export type FinanceInventoryManualItemFormValues = z.input<
  typeof FinanceInventoryManualItemFormSchema
>;
