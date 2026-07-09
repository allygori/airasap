'use client';

import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
import { ORDER_PLATFORMS } from '@/constant/order-platform';
// import { formSchema } from './form.schema';
import { VariantsSubForm } from './variants.subform';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProductResponseDTO } from '@/modules/products/product.dto';

type ProductFormProps = {
  title?: string;
  productId?: string;
};

export const ProductForm = withForm({
  defaultValues: {
    id: '',
    platform: undefined,
    name: '',
    product_id: '',
    variants: [],
    options: [],
    is_active: false,
    _id: '',
    // } as z.input<typeof formSchema>,
  } as ProductResponseDTO,
  props: {
    title: undefined,
    productId: undefined,
  } as ProductFormProps,
  render: function Render({ form }) {
    const router = useRouter();
    const [showDiscardDialog, setShowDiscardDialog] =
      useState(false);

    const handleBackClick = () => {
      if (form.state.isDirty) {
        setShowDiscardDialog(true);
      } else {
        router.back();
      }
    };

    const confirmDiscard = () => {
      setShowDiscardDialog(false);
      router.push('/dashboard/products');
    };

    return (
      <>
        <form
          id="product-form"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="flex flex-col items-start gap-6 lg:flex-row"
        >
          <div className="flex w-full flex-1 flex-col gap-6">
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
                <FieldGroup className="grid grid-cols-2 gap-6">
                  <form.AppField
                    name="name"
                    children={(field) => (
                      <field.TextField
                        label="Product Name"
                        autoComplete="off"
                        className="col-span-full text-xl font-normal shadow-none focus-visible:bg-transparent focus-visible:ring-0 md:text-lg"
                      />
                    )}
                  />

                  <form.AppField
                    name="platform"
                    children={(field) => (
                      <field.SelectField
                        label="Platform"
                        multiple={false}
                        className="col-span-1"
                        disabled={true}
                        items={Object.values(
                          ORDER_PLATFORMS
                        ).map((p) => ({
                          label: p.label.toUpperCase(),
                          value: p.value,
                        }))}
                      />
                    )}
                  />

                  <form.AppField
                    name="product_id"
                    children={(field) => (
                      <field.TextField
                        type="text"
                        label="Product ID"
                        disabled={true}
                      />
                    )}
                  />
                </FieldGroup>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  Variants & HPP
                </CardTitle>
                <CardDescription>
                  Kelola variant produk dan riwayat HPP yang
                  akan dipakai untuk order dan laporan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VariantsSubForm form={form} />
              </CardContent>
              <CardFooter>
                <div className="bg-background/95 mt-6 flex w-full flex-row items-center justify-end justify-items-end gap-6 overflow-hidden rounded-b-lg border-t p-4 shadow-lg backdrop-blur-xs">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackClick}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />{' '}
                    Kembali
                  </Button>

                  <div className="w-4/12">
                    <form.AppForm>
                      <form.SubmitButton text="Save Product" />
                    </form.AppForm>
                  </div>
                </div>
                {/* <FieldGroup className="flex flex-col gap-6">
                <form.AppForm>
                  <form.SubmitButton text="Save Product" />
                </form.AppForm>
              </FieldGroup> */}
              </CardFooter>
            </Card>
          </div>
        </form>
        {/* DISCARD CHANGES DIALOG */}
        <Dialog
          open={showDiscardDialog}
          onOpenChange={setShowDiscardDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buang Perubahan?</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin membuang perubahan?
                Semua perubahan yang belum disimpan akan
                hilang.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDiscardDialog(false)}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDiscard}
              >
                Ya, Buang
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  },
});
