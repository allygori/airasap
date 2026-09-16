'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { revalidateLogic } from '@tanstack/react-form';
import { z } from 'zod';

import { useAppForm } from '@/components/form/form.hook';
import {
  InventoryLocationForm,
  InventoryLocationFormSchema,
} from '../../_components/inventory-location.form';
import { CreateInventoryLocationSchema } from '@/modules/inventory/locations/inventory-location.schema';

const defaultValues: z.input<
  typeof InventoryLocationFormSchema
> = {
  code: '',
  name: '',
  type: 'warehouse',
  is_active: true,
  description: '',
};

export default function CreateInventoryLocationPage() {
  const router = useRouter();
  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: InventoryLocationFormSchema },
    onSubmit: async ({ value }) => {
      try {
        const payload = CreateInventoryLocationSchema.parse(
          {
            ...value,
            description: value.description || undefined,
          }
        );
        const response = await fetch(
          '/api/v1/dashboard/inventory/locations',
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
              'Gagal membuat lokasi inventory.'
          );
        }
        toast.success(
          'Inventory location berhasil dibuat.'
        );
        router.push('/dashboard/inventory/locations');
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Gagal membuat lokasi inventory.'
        );
      }
    },
  });

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div>
          <h2 className="mb-1 text-xl font-semibold">
            Tambah Inventory Location
          </h2>
          <p className="text-muted-foreground text-sm">
            Tambahkan lokasi fisik atau logis untuk stock
            movement.
          </p>
        </div>
        <InventoryLocationForm
          form={form}
          title="Inventory location baru"
        />
      </div>
    </div>
  );
}
