'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { revalidateLogic } from '@tanstack/react-form';
import { z } from 'zod';

import { useAppForm } from '@/components/form/form.hook';
import {
  InventoryMappingForm,
  InventoryMappingFormSchema,
} from '../../_components/inventory-mapping.form';
import { UpdateInventoryItemMappingSchema } from '@/modules/inventory/mappings/inventory-item-mapping.schema';

type MappingData = Omit<
  z.infer<typeof InventoryMappingFormSchema>,
  'product' | 'inventory_item'
> & {
  _id: string;
  variant_key: string;
  product:
    | {
        _id?: string;
        name?: string;
      }
    | string;
  inventory_item:
    | {
        _id?: string;
        name?: string;
        sku?: string;
      }
    | string;
};

export default function EditInventoryMappingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<MappingData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/dashboard/inventory/mappings/${id}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(
            result.error?.message ||
              result.message ||
              'Gagal memuat mapping.'
          );
        }
        setData(result.data);
      })
      .catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Gagal memuat inventory mapping.'
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="text-muted-foreground flex min-h-100 flex-1 items-center justify-center">
        Memuat inventory mapping...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-destructive flex min-h-100 flex-1 items-center justify-center">
        Inventory mapping tidak ditemukan.
      </div>
    );
  }

  return (
    <EditInventoryMappingForm initialData={data} id={id} />
  );
}

function EditInventoryMappingForm({
  initialData,
  id,
}: {
  initialData: MappingData;
  id: string;
}) {
  const router = useRouter();
  const product =
    typeof initialData.product === 'object' &&
    initialData.product
      ? initialData.product
      : undefined;
  const inventoryItem =
    typeof initialData.inventory_item === 'object' &&
    initialData.inventory_item
      ? initialData.inventory_item
      : undefined;
  const defaultValues = useMemo(
    () => ({
      product:
        product?._id ||
        (typeof initialData.product === 'string'
          ? initialData.product
          : ''),
      variant_id: initialData.variant_id || '',
      inventory_item:
        inventoryItem?._id ||
        (typeof initialData.inventory_item === 'string'
          ? initialData.inventory_item
          : ''),
      mapping_method: initialData.mapping_method,
      is_active: initialData.is_active ?? true,
      notes: initialData.notes || '',
    }),
    [initialData, inventoryItem, product]
  );
  const form = useAppForm({
    defaultValues: defaultValues as z.input<
      typeof InventoryMappingFormSchema
    >,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: InventoryMappingFormSchema },
    onSubmit: async ({ value }) => {
      try {
        const payload =
          UpdateInventoryItemMappingSchema.parse({
            ...value,
            variant_id: value.variant_id || undefined,
            notes: value.notes || undefined,
          });
        const response = await fetch(
          `/api/v1/dashboard/inventory/mappings/${id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );
        const result = await response.json();
        if (!response.ok) {
          throw new Error(
            result.error?.message ||
              result.message ||
              'Gagal memperbarui inventory mapping.'
          );
        }
        toast.success(
          'Inventory mapping berhasil diperbarui.'
        );
        router.push('/dashboard/inventory/mappings');
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Gagal memperbarui inventory mapping.'
        );
      }
    },
  });

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div>
          <h2 className="mb-1 text-xl font-semibold">
            Edit Product Mapping
          </h2>
          <p className="text-muted-foreground text-sm">
            Perbarui hubungan product/variant dengan
            inventory item internal.
          </p>
        </div>
        <InventoryMappingForm
          form={form}
          title={product?.name || 'Inventory mapping'}
          initialProduct={
            product?._id && product.name
              ? { _id: product._id, name: product.name }
              : undefined
          }
          initialInventoryItem={
            inventoryItem?._id && inventoryItem.name
              ? {
                  _id: inventoryItem._id,
                  name: inventoryItem.name,
                  sku: inventoryItem.sku,
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
