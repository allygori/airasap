/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@tanstack/react-form';
import { withForm } from '@/components/form/form.hook';
import { FieldGroup } from '@/components/ui/field';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { z } from 'zod';
import type { ProductResponseDTO } from '@/modules/products/product.dto';

export const InventoryMappingFormSchema = z.object({
  product: z
    .string()
    .trim()
    .min(1, 'Product wajib dipilih.'),
  variant_id: z.string().trim().optional(),
  inventory_item: z
    .string()
    .trim()
    .min(1, 'Inventory item wajib dipilih.'),
  mapping_method: z.enum([
    'manual',
    'sku',
    'product_match',
    'imported',
  ]),
  is_active: z.boolean(),
  notes: z.string().trim().optional(),
});

type InventoryMappingFormValues = z.input<
  typeof InventoryMappingFormSchema
>;

type InventoryMappingFormProps = {
  title?: string;
  initialProduct?: {
    _id: string;
    name: string;
  };
  initialInventoryItem?: {
    _id: string;
    name: string;
    sku?: string;
  };
};

type ProductVariant = NonNullable<
  ProductResponseDTO['variants']
>[number];

export const InventoryMappingForm = withForm({
  defaultValues: {
    product: '',
    variant_id: '',
    inventory_item: '',
    mapping_method: 'manual',
    is_active: true,
    notes: '',
  } as InventoryMappingFormValues,
  props: {
    title: undefined,
    initialProduct: undefined,
    initialInventoryItem: undefined,
  } as InventoryMappingFormProps,
  render: function Render({
    form,
    title,
    initialProduct,
    initialInventoryItem,
  }) {
    const router = useRouter();
    const selectedProductId = useStore(
      form.store,
      (state) => state.values.product
    );
    const [product, setProduct] =
      useState<ProductResponseDTO | null>(null);
    const [isLoadingProduct, setIsLoadingProduct] =
      useState(false);
    const previousProductId = useRef('');

    useEffect(() => {
      if (!selectedProductId) {
        setProduct(null);
        return;
      }

      if (
        previousProductId.current &&
        previousProductId.current !== selectedProductId
      ) {
        form.setFieldValue('variant_id', '');
      }
      previousProductId.current = selectedProductId;

      let cancelled = false;
      setIsLoadingProduct(true);
      fetch(
        `/api/v1/dashboard/products/${selectedProductId}`
      )
        .then(async (response) => {
          const result = await response.json();
          if (!response.ok) {
            throw new Error(
              result.error?.message ||
                result.message ||
                'Gagal memuat detail product.'
            );
          }
          if (!cancelled) setProduct(result.data);
        })
        .catch(() => {
          if (!cancelled) setProduct(null);
        })
        .finally(() => {
          if (!cancelled) setIsLoadingProduct(false);
        });

      return () => {
        cancelled = true;
      };
    }, [form, selectedProductId]);

    const variants = useMemo<ProductVariant[]>(
      () => product?.variants ?? [],
      [product]
    );
    const variantItems = useMemo(
      () => [
        {
          label: 'Product-level (tanpa variant)',
          value: '',
        },
        ...variants.map((variant) => ({
          label: `${variant.name} · ${variant.child_sku || variant.variant_id}`,
          value: variant.variant_id,
        })),
      ],
      [variants]
    );
    const productItems = initialProduct
      ? [
          {
            label: initialProduct.name,
            value: initialProduct._id,
          },
        ]
      : [];
    const inventoryItems = initialInventoryItem
      ? [
          {
            label: `${initialInventoryItem.sku || '-'} · ${initialInventoryItem.name}`,
            value: initialInventoryItem._id,
          },
        ]
      : [];

    return (
      <form
        id="inventory-mapping-form"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
        className="flex flex-col gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>
              {title || 'Product mapping'}
            </CardTitle>
            <CardDescription>
              Hubungkan product listing atau variant dari
              store ke satu inventory item internal. Mapping
              ini dipakai saat order dikonversi ke inventory
              dan accounting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="grid gap-5 md:grid-cols-2">
              <form.AppField
                name="product"
                children={(field) => (
                  <field.SelectField
                    label="Product"
                    placeholder="Cari dan pilih product"
                    items={productItems}
                    remote={{
                      url: '/api/v1/dashboard/products',
                      resultsKey: 'data',
                      valueKey: '_id',
                      labelKey: 'name',
                      searchParam: 'search',
                      limit: 50,
                    }}
                    description="Product berasal dari listing yang diimport ke store aktif."
                  />
                )}
              />
              <form.AppField
                name="variant_id"
                children={(field) => (
                  <field.SelectField
                    label="Variant"
                    placeholder={
                      isLoadingProduct
                        ? 'Memuat variant...'
                        : 'Pilih variant atau product-level'
                    }
                    items={variantItems}
                    disabled={
                      !selectedProductId || isLoadingProduct
                    }
                    description="Pilih product-level jika semua variasi product memakai inventory item yang sama."
                  />
                )}
              />
              <form.AppField
                name="inventory_item"
                children={(field) => (
                  <field.SelectField
                    label="Inventory item"
                    placeholder="Cari dan pilih inventory item"
                    items={inventoryItems}
                    remote={{
                      url: '/api/v1/dashboard/inventory/items?is_active=true',
                      resultsKey: 'data',
                      valueKey: '_id',
                      labelKey: 'name',
                      searchParam: 'search',
                      limit: 50,
                    }}
                    description="Inventory item harus aktif dan bertipe merchandise untuk order sales."
                  />
                )}
              />
              <form.AppField
                name="mapping_method"
                children={(field) => (
                  <field.SelectField
                    label="Mapping method"
                    items={[
                      { label: 'Manual', value: 'manual' },
                      { label: 'SKU', value: 'sku' },
                      {
                        label: 'Product matching',
                        value: 'product_match',
                      },
                      {
                        label: 'Imported',
                        value: 'imported',
                      },
                    ]}
                  />
                )}
              />
              <form.AppField
                name="is_active"
                children={(field) => (
                  <field.SwitchField
                    label="Mapping aktif"
                    description="Mapping aktif akan dipakai oleh order integration."
                  />
                )}
              />
              <form.AppField
                name="notes"
                children={(field) => (
                  <field.TextareaField
                    label="Catatan"
                    placeholder="Contoh: Semua variasi warna memakai SKU internal yang sama"
                    className="md:col-span-2"
                  />
                )}
              />
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 border-t sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Batal
            </Button>
            <form.AppForm>
              <form.SubmitButton text="Simpan mapping" />
            </form.AppForm>
          </CardFooter>
        </Card>
      </form>
    );
  },
});
