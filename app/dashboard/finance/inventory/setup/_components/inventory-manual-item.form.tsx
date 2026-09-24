/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import { useStore } from '@tanstack/react-form';
import { withForm } from '@/components/form/form.hook';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import type { FinanceInventoryManualItemFormValues } from './inventory-setup.schema';

type InventoryManualItemFormProps = {
  isSaving: boolean;
};

export function createFinanceInventoryManualItemFormDefaults(): FinanceInventoryManualItemFormValues {
  return {
    sku: '',
    name: '',
    item_type: 'packaging',
    unit: 'pcs',
    track_quantity: true,
    track_value: true,
  };
}

const itemTypeOptions = [
  { label: 'Barang dagang', value: 'merchandise' },
  { label: 'Kemasan', value: 'packaging' },
  { label: 'Perlengkapan', value: 'supplies' },
  { label: 'Aset tetap', value: 'fixed_asset' },
] as const;

export const InventoryManualItemForm = withForm({
  defaultValues: {
    sku: '',
    name: '',
    item_type: 'packaging',
    unit: 'pcs',
    track_quantity: true,
    track_value: true,
  } as FinanceInventoryManualItemFormValues,
  props: {
    isSaving: false,
  } as InventoryManualItemFormProps,
  render: function Render({ form, isSaving }) {
    const trackQuantity = useStore(
      form.store,
      (state) => state.values.track_quantity
    );

    return (
      <form
        className="grid min-w-0 gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <FieldGroup className="grid min-w-0 gap-4 sm:grid-cols-2">
          <form.AppField
            name="name"
            children={(field) => (
              <field.TextField
                label="Nama barang"
                maxLength={160}
                placeholder="Contoh: Dus ukuran sedang"
                className="min-w-0"
                disabled={isSaving}
              />
            )}
          />
          <form.AppField
            name="sku"
            children={(field) => (
              <field.TextField
                label="SKU / kode item"
                maxLength={80}
                placeholder="Contoh: BOX-SEDANG"
                className="min-w-0"
                disabled={isSaving}
              />
            )}
          />
          <form.AppField
            name="item_type"
            children={(field) => (
              <field.SelectField
                label="Jenis barang"
                description="Membantu mengelompokkan item di inventory."
                items={itemTypeOptions.map((item) => ({
                  label: item.label,
                  value: item.value,
                }))}
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

        <FieldGroup className="grid min-w-0 gap-3 sm:grid-cols-2">
          <form.AppField
            name="track_quantity"
            children={(field) => (
              <field.SwitchField
                label="Lacak jumlah stok"
                description="Gunakan untuk barang yang keluar-masuk gudang."
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
                description="Memerlukan pelacakan jumlah stok."
                disabled={isSaving || !trackQuantity}
              />
            )}
          />
        </FieldGroup>

        <div className="border-t pt-4">
          <p className="text-muted-foreground mb-3 text-sm">
            Item ini belum terkait ke produk katalog. Stok
            awal dicatat melalui onboarding Finance.
          </p>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <Spinner data-icon="inline-start" />
            ) : null}
            Simpan barang
          </Button>
        </div>
      </form>
    );
  },
});
