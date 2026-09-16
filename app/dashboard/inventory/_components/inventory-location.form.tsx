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
import { z } from 'zod';

export const InventoryLocationFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Kode lokasi wajib diisi.'),
  name: z
    .string()
    .trim()
    .min(1, 'Nama lokasi wajib diisi.'),
  type: z.enum(['warehouse', 'store_room', 'other']),
  is_active: z.boolean(),
  description: z.string().trim().optional(),
});

type InventoryLocationFormProps = {
  title?: string;
};

export const InventoryLocationForm = withForm({
  defaultValues: {
    code: '',
    name: '',
    type: 'warehouse',
    is_active: true,
    description: '',
  } as z.input<typeof InventoryLocationFormSchema>,
  props: { title: undefined } as InventoryLocationFormProps,
  render: function Render({ form, title }) {
    const router = useRouter();

    return (
      <form
        id="inventory-location-form"
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
              {title || 'Inventory location'}
            </CardTitle>
            <CardDescription>
              Lokasi fisik atau logis untuk menyimpan stok.
              Location bukan store/workspace dan bukan
              platform penjualan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="grid gap-5 md:grid-cols-2">
              <form.AppField
                name="code"
                children={(field) => (
                  <field.TextField
                    label="Kode lokasi"
                    placeholder="Contoh: MAIN"
                  />
                )}
              />
              <form.AppField
                name="name"
                children={(field) => (
                  <field.TextField
                    label="Nama lokasi"
                    placeholder="Contoh: Gudang Utama"
                  />
                )}
              />
              <form.AppField
                name="type"
                children={(field) => (
                  <field.SelectField
                    label="Tipe lokasi"
                    items={[
                      {
                        label: 'Warehouse',
                        value: 'warehouse',
                      },
                      {
                        label: 'Store room',
                        value: 'store_room',
                      },
                      { label: 'Lainnya', value: 'other' },
                    ]}
                  />
                )}
              />
              <form.AppField
                name="is_active"
                children={(field) => (
                  <field.SwitchField
                    label="Lokasi aktif"
                    description="Lokasi aktif dapat dipakai dalam purchase dan sale movement."
                  />
                )}
              />
              <form.AppField
                name="description"
                children={(field) => (
                  <field.TextareaField
                    label="Catatan"
                    placeholder="Catatan internal tentang lokasi ini"
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
              <form.SubmitButton text="Simpan lokasi" />
            </form.AppForm>
          </CardFooter>
        </Card>
      </form>
    );
  },
});
