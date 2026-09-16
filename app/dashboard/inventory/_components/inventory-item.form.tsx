/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import { useRouter } from 'next/navigation';
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
import { INVENTORY_ITEM_TYPE_VALUES } from '@/modules/inventory/items/inventory-item.schema';
import { z } from 'zod';

export const InventoryItemFormSchema = z.object({
  sku: z.string().trim().min(1, 'SKU wajib diisi.'),
  name: z.string().trim().min(1, 'Nama item wajib diisi.'),
  item_type: z.enum(INVENTORY_ITEM_TYPE_VALUES),
  unit: z.string().trim().min(1, 'Satuan wajib diisi.'),
  track_quantity: z.boolean(),
  track_value: z.boolean(),
  is_active: z.boolean(),
  inventory_account: z.string().trim().optional(),
  cogs_account: z.string().trim().optional(),
  reorder_point: z.preprocess(
    (value) =>
      value === '' || value === undefined
        ? undefined
        : Number(value),
    z.number().int().nonnegative().optional()
  ),
  description: z.string().trim().optional(),
});

type InventoryItemFormProps = {
  title?: string;
};

export const InventoryItemForm = withForm({
  defaultValues: {
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
  } as z.input<typeof InventoryItemFormSchema>,
  props: { title: undefined } as InventoryItemFormProps,
  render: function Render({ form, title }) {
    const router = useRouter();

    return (
      <form
        id="inventory-item-form"
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
              {title || 'Inventory item'}
            </CardTitle>
            <CardDescription>
              Master data untuk barang dagang, bahan
              packing, supplies, dan aset yang perlu
              dilacak.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="grid gap-5 md:grid-cols-2">
              <form.AppField
                name="sku"
                children={(field) => (
                  <field.TextField
                    label="SKU"
                    placeholder="Contoh: SKU-001"
                    description="Dipakai untuk mencocokkan order dengan inventory item."
                  />
                )}
              />
              <form.AppField
                name="name"
                children={(field) => (
                  <field.TextField
                    label="Nama item"
                    placeholder="Contoh: Kaos hitam ukuran M"
                  />
                )}
              />
              <form.AppField
                name="item_type"
                children={(field) => (
                  <field.SelectField
                    label="Tipe item"
                    placeholder="Pilih tipe item"
                    items={[
                      {
                        label: 'Merchandise',
                        value: 'merchandise',
                      },
                      {
                        label: 'Packaging',
                        value: 'packaging',
                      },
                      {
                        label: 'Supplies',
                        value: 'supplies',
                      },
                      {
                        label: 'Fixed asset',
                        value: 'fixed_asset',
                      },
                    ]}
                  />
                )}
              />
              <form.AppField
                name="unit"
                children={(field) => (
                  <field.TextField
                    label="Satuan"
                    placeholder="pcs, roll, box, kg"
                  />
                )}
              />
              <form.AppField
                name="reorder_point"
                children={(field) => (
                  <field.TextField
                    label="Reorder point"
                    type="number"
                    min={0}
                    placeholder="Opsional"
                    description="Batas minimum sebelum item perlu dibeli kembali."
                  />
                )}
              />
              <form.AppField
                name="inventory_account"
                children={(field) => (
                  <field.TextField
                    label="Inventory account ID"
                    placeholder="Opsional"
                    description="Kosongkan untuk memakai akun default workflow."
                  />
                )}
              />
              <form.AppField
                name="cogs_account"
                children={(field) => (
                  <field.TextField
                    label="COGS account ID"
                    placeholder="Opsional"
                    description="Kosongkan untuk memakai akun default workflow."
                  />
                )}
              />
              <div className="flex flex-col gap-4 rounded-lg border p-4">
                <form.AppField
                  name="track_quantity"
                  children={(field) => (
                    <field.SwitchField
                      label="Lacak kuantitas"
                      description="Perubahan jumlah stok dicatat sebagai movement."
                    />
                  )}
                />
                <form.AppField
                  name="track_value"
                  children={(field) => (
                    <field.SwitchField
                      label="Lacak nilai"
                      description="Nilai inventory dipakai untuk costing dan journal."
                    />
                  )}
                />
                <form.AppField
                  name="is_active"
                  children={(field) => (
                    <field.SwitchField
                      label="Item aktif"
                      description="Item aktif dapat dipakai dalam purchase dan sale movement."
                    />
                  )}
                />
              </div>
              <form.AppField
                name="description"
                children={(field) => (
                  <field.TextareaField
                    label="Catatan"
                    placeholder="Catatan internal tentang item ini"
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
              <form.SubmitButton text="Simpan inventory item" />
            </form.AppForm>
          </CardFooter>
        </Card>
      </form>
    );
  },
});
