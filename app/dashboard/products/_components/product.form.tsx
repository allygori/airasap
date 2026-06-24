'use client';

import { z } from 'zod';
import { useState } from 'react';
import { toast } from 'sonner';
import { withForm } from '@/components/form/form.hook';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { formSchema } from './form.schema';
import { PLATFORMS } from '@/lib/db/constant';
// import { ProductCostForm } from '../../product-costs/_components/product-cost.form';
import ProductCostsList from './product-costs-list';
import { ProductResponseDTO } from '@/modules/products/product.dto';
import { VariantsSubForm } from './variants.subform';

type ProductFormProps = {
  title?: string;
  productId?: string;
};

export const ProductForm = withForm({
  defaultValues: {
    id: '',
    platform: '',
    name: '',
    product_id: undefined,
    variants: [],
    // } as unknown as z.input<typeof formSchema>,
  } as unknown as ProductResponseDTO,
  props: {
    title: undefined,
    productId: undefined,
  } as ProductFormProps,
  render: function Render({ form, title, productId }) {
    return (
      <form
        id="product-form"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="flex flex-col items-start gap-6 lg:flex-row"
      >
        {/* LEFT COLUMN: MAIN CONTENT */}
        <div className="flex w-full flex-1 flex-col gap-6">
          {/* section:basic-info */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">
                Product Details
              </CardTitle>
              <CardDescription>
                Basic information about the product.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup className="flex flex-col gap-6">
                <form.AppField
                  name="name"
                  children={(field) => (
                    <field.TextField
                      label="Product Name"
                      autoComplete="off"
                      className="h-10 text-xl font-normal shadow-none focus-visible:bg-transparent focus-visible:ring-0 md:text-lg"
                    />
                  )}
                />

                <form.AppField
                  name="platform"
                  children={(field) => (
                    <field.SelectField
                      label="Platform"
                      multiple={false}
                      items={PLATFORMS.map((p) => ({
                        label: p,
                        value: p,
                      }))}
                    />
                  )}
                />

                <form.AppField
                  name="product_id"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="Product ID"
                    />
                  )}
                />
              </FieldGroup>
            </CardContent>
          </Card>

          {/* section:single-variant */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">
                Harga dan HPP
              </CardTitle>
              <CardDescription>
                Kelola detail varian.
              </CardDescription>
            </CardHeader>
            <CardContent></CardContent>
          </Card>

          {/* section:variants */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">
                Variants
              </CardTitle>
              <CardDescription>
                Manage order variants.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* <VariantsSubForm form={form} /> */}
            </CardContent>
            <CardFooter>
              <FieldGroup className="flex flex-col gap-6">
                <form.AppForm>
                  <form.SubmitButton text="Save Product" />
                </form.AppForm>
              </FieldGroup>
            </CardFooter>
          </Card>
        </div>

        {/* RIGHT COLUMN: SIDEBAR */}
        {/* <div className="flex w-full shrink-0 flex-col gap-6 lg:sticky lg:top-8 lg:w-80">
          <FieldGroup className="flex flex-col gap-6">
            <form.AppForm>
              <form.SubmitButton text="Save Product" />
            </form.AppForm>
          </FieldGroup>
        </div> */}
      </form>
    );
  },
});

type ProductCostSubFormProps = {
  productId: string;
  initialCost: any;
  onSave: (costId: string, costObject: any) => void;
};

export function ProductCostSubForm({
  productId,
  initialCost,
  onSave,
}: ProductCostSubFormProps) {
  const costId =
    initialCost?._id ||
    (typeof initialCost === 'string' ? initialCost : '');

  const [cogsUnit, setCogsUnit] = useState<number>(
    initialCost?.cogs_unit || 0
  );
  const [effectiveFrom, setEffectiveFrom] =
    useState<string>(
      initialCost?.effective_from
        ? new Date(initialCost.effective_from)
            .toISOString()
            .substring(0, 10)
        : new Date().toISOString().substring(0, 10)
    );
  const [notes, setNotes] = useState<string>(
    initialCost?.notes || ''
  );
  const [saving, setSaving] = useState(false);

  const handleSaveCost = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!productId) {
      toast.error(
        'Simpan produk terlebih dahulu sebelum menambahkan harga modal.'
      );
      return;
    }

    setSaving(true);
    try {
      const url = costId
        ? `/api/v1/dashboard/product-costs/${costId}`
        : '/api/v1/dashboard/product-costs';

      const method = costId ? 'PATCH' : 'POST';
      const body = {
        product: productId,
        cogs_unit: Number(cogsUnit),
        effective_from: new Date(
          effectiveFrom
        ).toISOString(),
        notes: notes || null,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.message || 'Gagal menyimpan harga modal'
        );
      }

      toast.success(
        costId
          ? 'Harga modal diperbarui'
          : 'Harga modal berhasil ditambahkan'
      );

      const savedData = result.data;
      onSave(savedData._id, savedData);
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-border/80 mt-4 border-t border-dashed pt-4">
      <h4 className="text-foreground/80 mb-3 flex items-center gap-2 text-sm font-semibold">
        💰 Harga Modal (COGS / HPP)
      </h4>
      <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
        <div>
          <label className="text-muted-foreground mb-1 block text-xs font-medium">
            Harga Modal (Rp)
          </label>
          <input
            type="number"
            value={cogsUnit}
            onChange={(e) =>
              setCogsUnit(Number(e.target.value))
            }
            className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Contoh: 50000"
          />
        </div>
        <div>
          <label className="text-muted-foreground mb-1 block text-xs font-medium">
            Mulai Berlaku
          </label>
          <input
            type="date"
            value={effectiveFrom}
            onChange={(e) =>
              setEffectiveFrom(e.target.value)
            }
            className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <div>
          <label className="text-muted-foreground mb-1 block text-xs font-medium">
            Catatan
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Opsional"
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button
          type="button"
          size="sm"
          onClick={handleSaveCost}
          disabled={saving}
          className="bg-primary/90 text-primary-foreground hover:bg-primary shadow-sm"
        >
          {saving
            ? 'Menyimpan...'
            : costId
              ? 'Perbarui COGS'
              : 'Simpan COGS'}
        </Button>
      </div>
    </div>
  );
}
