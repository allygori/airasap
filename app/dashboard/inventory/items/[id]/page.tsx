'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { revalidateLogic } from '@tanstack/react-form';
import { z } from 'zod';

import { useAppForm } from '@/components/form/form.hook';
import {
  InventoryItemForm,
  InventoryItemFormSchema,
} from '../../_components/inventory-item.form';
import { UpdateInventoryItemSchema } from '@/modules/inventory/items/inventory-item.schema';

type InventoryItemData = z.infer<
  typeof InventoryItemFormSchema
> & { _id: string };

export default function EditInventoryItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] =
    useState<InventoryItemData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/dashboard/inventory/items/${id}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(
            result.message || 'Gagal memuat item.'
          );
        }
        setData(result.data);
      })
      .catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Gagal memuat inventory item.'
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="text-muted-foreground flex min-h-100 flex-1 items-center justify-center">
        Memuat inventory item...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-destructive flex min-h-100 flex-1 items-center justify-center">
        Inventory item tidak ditemukan.
      </div>
    );
  }

  return (
    <EditInventoryItemForm initialData={data} id={id} />
  );
}

function EditInventoryItemForm({
  initialData,
  id,
}: {
  initialData: InventoryItemData;
  id: string;
}) {
  const router = useRouter();
  const defaultValues = useMemo(
    () => ({
      sku: initialData.sku || '',
      name: initialData.name || '',
      item_type: initialData.item_type,
      unit: initialData.unit || 'pcs',
      track_quantity: initialData.track_quantity ?? true,
      track_value: initialData.track_value ?? true,
      is_active: initialData.is_active ?? true,
      inventory_account:
        initialData.inventory_account || '',
      cogs_account: initialData.cogs_account || '',
      reorder_point:
        initialData.reorder_point === undefined
          ? ''
          : String(initialData.reorder_point),
      description: initialData.description || '',
    }),
    [initialData]
  );
  const form = useAppForm({
    defaultValues: defaultValues as z.input<
      typeof InventoryItemFormSchema
    >,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: InventoryItemFormSchema },
    onSubmit: async ({ value }) => {
      try {
        const payload = UpdateInventoryItemSchema.parse({
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
          `/api/v1/dashboard/inventory/items/${id}`,
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
              'Gagal memperbarui inventory item.'
          );
        }
        toast.success(
          'Inventory item berhasil diperbarui.'
        );
        router.push('/dashboard/inventory/items');
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Gagal memperbarui inventory item.'
        );
      }
    },
  });

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div>
          <h2 className="mb-1 text-xl font-semibold">
            Edit Inventory Item
          </h2>
          <p className="text-muted-foreground text-sm">
            Perbarui master item dan status tracking
            inventory.
          </p>
        </div>
        <InventoryItemForm
          form={form}
          title={initialData.name}
        />
      </div>
    </div>
  );
}
