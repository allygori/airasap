'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { revalidateLogic } from '@tanstack/react-form';
import { z } from 'zod';

import { useAppForm } from '@/components/form/form.hook';
import {
  InventoryItemForm,
  InventoryItemFormSchema,
} from '../../_components/inventory-item.form';
import { CreateInventoryItemSchema } from '@/modules/inventory/items/inventory-item.schema';

const defaultValues: z.input<
  typeof InventoryItemFormSchema
> = {
  sku: '',
  name: '',
  item_type: 'merchandise',
  unit: 'pcs',
  track_quantity: true,
  track_value: true,
  is_active: true,
  inventory_account: '',
  cogs_account: '',
  reorder_point: '',
  description: '',
};

export default function CreateInventoryItemPage() {
  const router = useRouter();
  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: InventoryItemFormSchema },
    onSubmit: async ({ value }) => {
      try {
        const payload = CreateInventoryItemSchema.parse({
          ...value,
          reorder_point:
            value.reorder_point === ''
              ? undefined
              : Number(value.reorder_point),
          inventory_account:
            value.inventory_account || undefined,
          cogs_account: value.cogs_account || undefined,
          description: value.description || undefined,
        });
        const response = await fetch(
          '/api/v1/dashboard/inventory/items',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );
        const result = await response.json();
        if (!response.ok) {
          throw new Error(
            result.message ||
              'Gagal membuat inventory item.'
          );
        }
        toast.success('Inventory item berhasil dibuat.');
        router.push('/dashboard/inventory/items');
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Gagal membuat inventory item.'
        );
      }
    },
  });

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div>
          <h2 className="mb-1 text-xl font-semibold">
            Tambah Inventory Item
          </h2>
          <p className="text-muted-foreground text-sm">
            Buat master item sebelum mencatat purchase atau
            mengonversi order.
          </p>
        </div>
        <InventoryItemForm
          form={form}
          title="Inventory item baru"
        />
      </div>
    </div>
  );
}
