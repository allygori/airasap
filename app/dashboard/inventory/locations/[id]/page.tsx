'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { revalidateLogic } from '@tanstack/react-form';
import { z } from 'zod';

import { useAppForm } from '@/components/form/form.hook';
import {
  InventoryLocationForm,
  InventoryLocationFormSchema,
} from '../../_components/inventory-location.form';
import { UpdateInventoryLocationSchema } from '@/modules/inventory/locations/inventory-location.schema';

type InventoryLocationData = z.infer<
  typeof InventoryLocationFormSchema
> & { _id: string };

export default function EditInventoryLocationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] =
    useState<InventoryLocationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/dashboard/inventory/locations/${id}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(
            result.message || 'Gagal memuat lokasi.'
          );
        }
        setData(result.data);
      })
      .catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Gagal memuat inventory location.'
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="text-muted-foreground flex min-h-100 flex-1 items-center justify-center">
        Memuat inventory location...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-destructive flex min-h-100 flex-1 items-center justify-center">
        Inventory location tidak ditemukan.
      </div>
    );
  }

  return (
    <EditInventoryLocationForm initialData={data} id={id} />
  );
}

function EditInventoryLocationForm({
  initialData,
  id,
}: {
  initialData: InventoryLocationData;
  id: string;
}) {
  const router = useRouter();
  const defaultValues = useMemo(
    () => ({
      code: initialData.code || '',
      name: initialData.name || '',
      type: initialData.type,
      is_active: initialData.is_active ?? true,
      description: initialData.description || '',
    }),
    [initialData]
  );
  const form = useAppForm({
    defaultValues: defaultValues as z.input<
      typeof InventoryLocationFormSchema
    >,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: InventoryLocationFormSchema },
    onSubmit: async ({ value }) => {
      try {
        const payload = UpdateInventoryLocationSchema.parse(
          {
            ...value,
            description: value.description || undefined,
          }
        );
        const response = await fetch(
          `/api/v1/dashboard/inventory/locations/${id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );
        const result = await response.json();
        if (!response.ok) {
          throw new Error(
            result.message ||
              'Gagal memperbarui lokasi inventory.'
          );
        }
        toast.success(
          'Inventory location berhasil diperbarui.'
        );
        router.push('/dashboard/inventory/locations');
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Gagal memperbarui lokasi inventory.'
        );
      }
    },
  });

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div>
          <h2 className="mb-1 text-xl font-semibold">
            Edit Inventory Location
          </h2>
          <p className="text-muted-foreground text-sm">
            Perbarui nama, tipe, dan status lokasi stock.
          </p>
        </div>
        <InventoryLocationForm
          form={form}
          title={initialData.name}
        />
      </div>
    </div>
  );
}
