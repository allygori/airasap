'use client';

import { z } from 'zod';
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
// import { PLATFORMS } from '@/lib/db/constant';
import { PLATFORMS_KV_WITH_LABEL } from '@/modules/constant';
import { formSchema } from './form.schema';
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
    product_id: '',
    variants: [],
  } as z.input<typeof formSchema>,
  props: {
    title: undefined,
    productId: undefined,
  } as ProductFormProps,
  render: function Render({ form }) {
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
                        PLATFORMS_KV_WITH_LABEL
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
              <FieldGroup className="flex flex-col gap-6">
                <form.AppForm>
                  <form.SubmitButton text="Save Product" />
                </form.AppForm>
              </FieldGroup>
            </CardFooter>
          </Card>
        </div>
      </form>
    );
  },
});
