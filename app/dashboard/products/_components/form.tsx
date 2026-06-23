'use client';

import { z } from 'zod';
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
import { formSchema } from './form.schema';
import { PLATFORMS } from '@/lib/db/constant';

type ProductFormProps = {
  title?: string;
};

export const ProductForm = withForm({
  defaultValues: {
    id: '',
    platform: '',
    name: '',
    product_id: undefined,
    variants: [],
  } as unknown as z.input<typeof formSchema>,
  props: {
    title: undefined,
  } as ProductFormProps,
  render: function Render({ form, title }) {
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
              <form.AppField
                name="variants"
                mode="array"
                children={(field) => (
                  <div className="flex flex-col gap-4">
                    {field.state.value?.map((_, i) => (
                      <div
                        key={i}
                        className="border-border relative flex flex-col gap-4 rounded-md border p-4"
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 absolute top-2 right-2"
                          onClick={() =>
                            field.removeValue(i)
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <form.AppField
                            name={`variants[${i}].variation_id`}
                            children={(subField) => (
                              <subField.TextField
                                type="number"
                                label="Variation ID"
                                value={
                                  subField.state.value ?? ''
                                }
                                onChange={(e) =>
                                  subField.handleChange(
                                    e.target.value === ''
                                      ? undefined
                                      : Number(
                                          e.target.value
                                        )
                                  )
                                }
                              />
                            )}
                          />

                          <form.AppField
                            name={`variants[${i}].name`}
                            children={(subField) => (
                              <subField.TextField
                                label="Variant Name"
                                value={
                                  subField.state.value ?? ''
                                }
                                onChange={(e) =>
                                  subField.handleChange(
                                    e.target.value
                                  )
                                }
                              />
                            )}
                          />

                          <form.AppField
                            name={`variants[${i}].price`}
                            children={(subField) => (
                              <subField.TextField
                                type="number"
                                label="Price"
                                value={
                                  subField.state.value ?? ''
                                }
                                onChange={(e) =>
                                  subField.handleChange(
                                    e.target.value === ''
                                      ? 0
                                      : Number(
                                          e.target.value
                                        )
                                  )
                                }
                              />
                            )}
                          />

                          <form.AppField
                            name={`variants[${i}].quantity`}
                            children={(subField) => (
                              <subField.TextField
                                type="number"
                                label="Quantity"
                                value={
                                  subField.state.value ?? ''
                                }
                                onChange={(e) =>
                                  subField.handleChange(
                                    e.target.value === ''
                                      ? 0
                                      : Number(
                                          e.target.value
                                        )
                                  )
                                }
                              />
                            )}
                          />

                          <form.AppField
                            name={`variants[${i}].discount`}
                            children={(subField) => (
                              <subField.TextField
                                type="number"
                                label="Discount"
                                value={
                                  subField.state.value ?? ''
                                }
                                onChange={(e) =>
                                  subField.handleChange(
                                    e.target.value === ''
                                      ? 0
                                      : Number(
                                          e.target.value
                                        )
                                  )
                                }
                              />
                            )}
                          />

                          <form.AppField
                            name={`variants[${i}].finalPrice`}
                            children={(subField) => (
                              <subField.TextField
                                type="number"
                                label="Final Price"
                                value={
                                  subField.state.value ?? ''
                                }
                                onChange={(e) =>
                                  subField.handleChange(
                                    e.target.value === ''
                                      ? undefined
                                      : Number(
                                          e.target.value
                                        )
                                  )
                                }
                              />
                            )}
                          />

                          <form.AppField
                            name={`variants[${i}].SKU`}
                            children={(subField) => (
                              <subField.TextField
                                label="SKU"
                                value={
                                  subField.state.value ?? ''
                                }
                                onChange={(e) =>
                                  subField.handleChange(
                                    e.target.value
                                  )
                                }
                              />
                            )}
                          />

                          <form.AppField
                            name={`variants[${i}].GTIN`}
                            children={(subField) => (
                              <subField.TextField
                                label="GTIN"
                                value={
                                  subField.state.value ?? ''
                                }
                                onChange={(e) =>
                                  subField.handleChange(
                                    e.target.value
                                  )
                                }
                              />
                            )}
                          />
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        field.pushValue({
                          variation_id: undefined,
                          name: '',
                          price: 0,
                          quantity: 0,
                          discount: 0,
                          finalPrice: undefined,
                          SKU: '',
                          GTIN: '',
                        })
                      }
                      className="mt-2"
                    >
                      Add Variant
                    </Button>
                  </div>
                )}
              />
            </CardContent>
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
