/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import { useStore } from '@tanstack/react-form';
import { withForm } from '@/components/form/form.hook';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import type { FinanceInventorySetupResponseDTO } from '@/modules/finance/client';
import type { FinanceInventoryProductSetupFormValues } from './inventory-setup.schema';

type ProductOption =
  FinanceInventorySetupResponseDTO['product_options'][number];
type InventoryItemOption =
  FinanceInventorySetupResponseDTO['inventory_items'][number];

type InventoryProductMappingFormProps = {
  product: ProductOption;
  inventoryItems: InventoryItemOption[];
  isSaving: boolean;
};

export function createFinanceInventoryProductSetupFormDefaults(
  product?: ProductOption
): FinanceInventoryProductSetupFormValues {
  const mappedItem = product?.mapped_inventory_item;
  return {
    mode: mappedItem ? 'existing' : 'create',
    sku: mappedItem?.sku ?? product?.sku ?? '',
    name:
      mappedItem?.name ??
      (product
        ? product.variant_name
          ? `${product.product_name} — ${product.variant_name}`
          : product.product_name
        : ''),
    unit: mappedItem?.unit ?? 'pcs',
    inventory_item_id: mappedItem?.id ?? '',
    track_quantity: mappedItem?.track_quantity ?? true,
    track_value: mappedItem?.track_value ?? true,
  };
}

const mappingModes = [
  { label: 'Buat item stok baru', value: 'create' },
  { label: 'Gunakan item yang ada', value: 'existing' },
] as const;

export const InventoryProductMappingForm = withForm({
  defaultValues: {
    mode: 'create',
    sku: '',
    name: '',
    unit: 'pcs',
    inventory_item_id: '',
    track_quantity: true,
    track_value: true,
  } as FinanceInventoryProductSetupFormValues,
  props: {
    product: {} as ProductOption,
    inventoryItems: [] as InventoryItemOption[],
    isSaving: false,
  } as InventoryProductMappingFormProps,
  render: function Render({
    form,
    product,
    inventoryItems,
    isSaving,
  }) {
    const mode = useStore(
      form.store,
      (state) => state.values.mode
    );
    const trackQuantity = useStore(
      form.store,
      (state) => state.values.track_quantity
    );

    const productLabel = product.variant_name
      ? `${product.product_name} — ${product.variant_name}`
      : product.product_name;
    const platformLabel =
      product.platform === 'tiktok-shop'
        ? 'TikTok Shop'
        : product.platform
          ? product.platform.charAt(0).toUpperCase() +
            product.platform.slice(1)
          : 'Katalog';
    const itemAlreadyMapped =
      product.mapped_inventory_item !== null;

    const submit = (
      event: React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();
      event.stopPropagation();
      void form.handleSubmit();
    };

    return (
      <form
        className="grid min-w-0 gap-5"
        onSubmit={submit}
      >
        <div className="bg-muted/40 flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl p-4">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Produk terpilih
            </p>
            <p className="mt-1 truncate font-semibold">
              {productLabel}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {platformLabel}{' '}
              <span aria-hidden="true">·</span> SKU{' '}
              {product.sku ?? 'belum tersedia'}
            </p>
          </div>
          {itemAlreadyMapped ? (
            <Badge variant="secondary" className="shrink-0">
              Sudah terhubung
            </Badge>
          ) : (
            <Badge variant="outline" className="shrink-0">
              Belum terhubung
            </Badge>
          )}
        </div>

        {itemAlreadyMapped ? (
          <Alert>
            <AlertDescription>
              Produk ini sudah menggunakan{' '}
              <span className="text-foreground font-medium">
                {product.mapped_inventory_item?.sku} —{' '}
                {product.mapped_inventory_item?.name}
              </span>
              . Pilih item lain di bawah jika hubungan
              stoknya ingin diganti.
            </AlertDescription>
          </Alert>
        ) : (
          <FieldGroup className="grid min-w-0 gap-3">
            <form.AppField
              name="mode"
              children={(field) => (
                <field.ToggleGroupField
                  label="Pilih cara menyiapkan stok"
                  description="Listing untuk barang yang sama di beberapa platform sebaiknya memakai satu item stok bersama."
                  items={mappingModes}
                  groupClassName="w-full"
                  disabled={isSaving}
                />
              )}
            />
          </FieldGroup>
        )}

        {mode === 'existing' ? (
          <FieldGroup className="grid min-w-0 gap-4">
            <form.AppField
              name="inventory_item_id"
              children={(field) => (
                <field.SelectField
                  label="Item stok bersama"
                  description={
                    inventoryItems.length === 0
                      ? 'Belum ada item barang dagang. Pilih “Buat item stok baru” atau tambahkan barang tanpa katalog di bawah.'
                      : 'Ketik SKU atau nama untuk mencari item yang sudah dibuat.'
                  }
                  placeholder="Cari dan pilih item stok…"
                  items={inventoryItems.map((item) => ({
                    label: `${item.sku} — ${item.name}`,
                    value: item.id,
                  }))}
                  disabled={
                    isSaving || inventoryItems.length === 0
                  }
                />
              )}
            />
            <Button
              type="submit"
              disabled={
                isSaving || inventoryItems.length === 0
              }
            >
              {isSaving ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              Simpan hubungan stok
            </Button>
          </FieldGroup>
        ) : (
          <>
            <FieldGroup className="grid min-w-0 gap-4 sm:grid-cols-2">
              <form.AppField
                name="sku"
                children={(field) => (
                  <field.TextField
                    label="SKU item stok"
                    maxLength={80}
                    placeholder="Contoh: KAOS-HITAM-M"
                    className="min-w-0"
                    disabled={isSaving}
                  />
                )}
              />
              <form.AppField
                name="name"
                children={(field) => (
                  <field.TextField
                    label="Nama item stok"
                    maxLength={160}
                    placeholder="Nama barang fisik"
                    className="min-w-0"
                    disabled={isSaving}
                  />
                )}
              />
              <form.AppField
                name="unit"
                children={(field) => (
                  <field.TextField
                    label="Satuan"
                    maxLength={40}
                    placeholder="pcs"
                    className="min-w-0 sm:max-w-48"
                    disabled={isSaving}
                  />
                )}
              />
            </FieldGroup>

            <Collapsible>
              <CollapsibleTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-fit px-0"
                  />
                }
              >
                Pengaturan pelacakan
              </CollapsibleTrigger>
              <CollapsibleContent>
                <FieldGroup className="grid min-w-0 gap-3 pt-3 sm:grid-cols-2">
                  <form.AppField
                    name="track_quantity"
                    children={(field) => (
                      <field.SwitchField
                        label="Lacak jumlah stok"
                        description="Aktifkan agar stok masuk dan keluar tercatat."
                        disabled={isSaving}
                        onCheckedChange={(checked) => {
                          field.handleChange(checked);
                          if (!checked) {
                            form.setFieldValue(
                              'track_value',
                              false
                            );
                          }
                        }}
                      />
                    )}
                  />
                  <form.AppField
                    name="track_value"
                    children={(field) => (
                      <field.SwitchField
                        label="Lacak nilai stok dan HPP"
                        description="Nilai baru dihitung setelah saldo awal atau biaya stok dicatat."
                        disabled={
                          isSaving || !trackQuantity
                        }
                      />
                    )}
                  />
                </FieldGroup>
              </CollapsibleContent>
            </Collapsible>

            <div className="border-t pt-4">
              <p className="text-muted-foreground mb-3 text-sm">
                Membuat item belum menambah jumlah stok.
                Saldo awal dapat dicatat melalui onboarding
                Finance.
              </p>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <Spinner data-icon="inline-start" />
                ) : null}
                Buat item dan hubungkan
              </Button>
            </div>
          </>
        )}
      </form>
    );
  },
});
