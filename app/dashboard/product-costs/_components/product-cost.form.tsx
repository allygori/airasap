'use client';

import { z } from 'zod';
import { useState } from 'react';
import { toast } from 'sonner';
import { withForm } from '@/components/form/form.hook';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
// import { formSchema } from './form.schema';
import { UpdateProductCostDTO } from '@/modules/product-costs/product-cost.dto';
import { PLATFORMS } from '@/lib/db/constant';

type ProductCostFormProps = {
  title?: string;
};

/**
 * @TODO inline form like table row
 */
export const ProductCostForm = withForm({
  // mode: 'object',

  defaultValues: {
    product: '',
    effective_from: '',
    cogs_unit: 0,
    notes: '',
  } as unknown as UpdateProductCostDTO,
  props: {
    title: undefined,
  } as ProductCostFormProps,
  render: function Render({ form, title }) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="flex flex-col items-start gap-6 lg:flex-row"
      >
        {/* LEFT COLUMN: MAIN CONTENT */}
        <div className="flex w-full flex-1 flex-col gap-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">
                💰 Harga Modal (COGS / HPP)
              </CardTitle>
              {/* <CardDescription>
                Basic information about the product.
              </CardDescription> */}
            </CardHeader>
            <CardContent>
              <FieldGroup className="flex flex-col gap-6">
                {/* <form.AppField
                  name="product"
                  children={(field) => (
                    <field.TextField
                      label="Product"
                      autoComplete="off"
                      className="h-10 text-xl font-normal shadow-none focus-visible:bg-transparent focus-visible:ring-0 md:text-lg"
                    />
                  )}
                /> */}

                {/* <form.AppField
                  name="effective_from"
                  children={(field) => (
                    <field.DateTimeField label="Efektif Sejak" />
                  )}
                /> */}

                {/* <form.AppField
                  name="cogs_unit"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="HPP per Unit"
                    />
                  )}
                /> */}
              </FieldGroup>
            </CardContent>
            {/* <CardFooter></CardFooter> */}
          </Card>
        </div>

        {/* RIGHT COLUMN: SIDEBAR */}
        <div className="flex w-full shrink-0 flex-col gap-6 lg:sticky lg:top-8 lg:w-80">
          <FieldGroup className="flex flex-col gap-6">
            <form.AppForm>
              <form.SubmitButton text="Save Product" />
            </form.AppForm>
          </FieldGroup>
        </div>
      </form>
    );
  },
});
