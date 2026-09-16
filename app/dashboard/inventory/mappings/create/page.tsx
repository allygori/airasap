'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { revalidateLogic } from '@tanstack/react-form';
import { z } from 'zod';

import { useAppForm } from '@/components/form/form.hook';
import {
  InventoryMappingForm,
  InventoryMappingFormSchema,
} from '../../_components/inventory-mapping.form';
import { CreateInventoryItemMappingSchema } from '@/modules/inventory/mappings/inventory-item-mapping.schema';

const defaultValues: z.input<
  typeof InventoryMappingFormSchema
> = {
  product: '',
  variant_id: '',
  inventory_item: '',
  mapping_method: 'manual',
  is_active: true,
  notes: '',
};

export default function CreateInventoryMappingPage() {
  const router = useRouter();
  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: InventoryMappingFormSchema },
    onSubmit: async ({ value }) => {
      try {
        const payload =
          CreateInventoryItemMappingSchema.parse({
            ...value,
            variant_id: value.variant_id || undefined,
            notes: value.notes || undefined,
          });
        const response = await fetch(
          '/api/v1/dashboard/inventory/mappings',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );
        const result = await response.json();
        if (!response.ok) {
          throw new Error(
            result.error?.message ||
              result.message ||
              'Gagal membuat inventory mapping.'
          );
        }
        toast.success('Inventory mapping berhasil dibuat.');
        router.push('/dashboard/inventory/mappings');
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Gagal membuat inventory mapping.'
        );
      }
    },
  });

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div>
          <h2 className="mb-1 text-xl font-semibold">
            Tambah Product Mapping
          </h2>
          <p className="text-muted-foreground text-sm">
            Buat mapping eksplisit agar order dapat
            menemukan inventory item yang benar.
          </p>
        </div>
        <InventoryMappingForm
          form={form}
          title="Mapping baru"
        />
      </div>
    </div>
  );
}
