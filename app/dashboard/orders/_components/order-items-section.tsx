import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';

export function OrderItemsSection({ form }: { form: any }) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">
            Daftar Produk (Items)
          </CardTitle>
          <CardDescription>
            Produk yang dipesan dalam order ini.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form.AppField
          name="items"
          mode="array"
          children={(field: any) => (
            <div className="flex flex-col gap-6">
              {field.state.value?.map(
                (_: any, i: number) => (
                  <div
                    key={i}
                    className="border-border relative flex flex-col gap-6 rounded-lg border p-5 shadow-sm"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 absolute top-3 right-3"
                      onClick={() => field.removeValue(i)}
                    >
                      <X className="h-4 w-4" />
                    </Button>

                    <h4 className="text-muted-foreground text-sm font-semibold">
                      Item #{i + 1}
                    </h4>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                      <form.AppField
                        name={`items[${i}].product`}
                        children={(subField: any) => (
                          <subField.TextField
                            label="Product ID"
                            value={
                              subField.state.value ?? ''
                            }
                            onChange={(e: any) =>
                              subField.handleChange(
                                e.target.value
                              )
                            }
                          />
                        )}
                      />

                      <form.AppField
                        name={`items[${i}].product_name`}
                        children={(subField: any) => (
                          <subField.TextField
                            label="Nama Produk"
                            value={
                              subField.state.value ?? ''
                            }
                            onChange={(e: any) =>
                              subField.handleChange(
                                e.target.value
                              )
                            }
                          />
                        )}
                      />

                      <form.AppField
                        name={`items[${i}].variation_name`}
                        children={(subField: any) => (
                          <subField.TextField
                            label="Nama Variasi"
                            value={
                              subField.state.value ?? ''
                            }
                            onChange={(e: any) =>
                              subField.handleChange(
                                e.target.value
                              )
                            }
                          />
                        )}
                      />

                      <form.AppField
                        name={`items[${i}].parent_sku`}
                        children={(subField: any) => (
                          <subField.TextField
                            label="Parent SKU"
                            value={
                              subField.state.value ?? ''
                            }
                            onChange={(e: any) =>
                              subField.handleChange(
                                e.target.value
                              )
                            }
                          />
                        )}
                      />

                      <form.AppField
                        name={`items[${i}].sku_reference_number`}
                        children={(subField: any) => (
                          <subField.TextField
                            label="SKU Reference Number"
                            value={
                              subField.state.value ?? ''
                            }
                            onChange={(e: any) =>
                              subField.handleChange(
                                e.target.value
                              )
                            }
                          />
                        )}
                      />

                      <form.AppField
                        name={`items[${i}].product_key`}
                        children={(subField: any) => (
                          <subField.TextField
                            label="Product Key"
                            value={
                              subField.state.value ?? ''
                            }
                            onChange={(e: any) =>
                              subField.handleChange(
                                e.target.value
                              )
                            }
                          />
                        )}
                      />

                      <form.AppField
                        name={`items[${i}].original_price`}
                        children={(subField: any) => (
                          <subField.TextField
                            type="number"
                            label="Harga Asli"
                            value={
                              subField.state.value ?? ''
                            }
                            onChange={(e: any) =>
                              subField.handleChange(
                                e.target.value === ''
                                  ? 0
                                  : Number(e.target.value)
                              )
                            }
                          />
                        )}
                      />

                      <form.AppField
                        name={`items[${i}].price_after_discount`}
                        children={(subField: any) => (
                          <subField.TextField
                            type="number"
                            label="Harga Setelah Diskon"
                            value={
                              subField.state.value ?? ''
                            }
                            onChange={(e: any) =>
                              subField.handleChange(
                                e.target.value === ''
                                  ? 0
                                  : Number(e.target.value)
                              )
                            }
                          />
                        )}
                      />

                      <form.AppField
                        name={`items[${i}].quantity`}
                        children={(subField: any) => (
                          <subField.TextField
                            type="number"
                            label="Kuantitas"
                            value={
                              subField.state.value ?? ''
                            }
                            onChange={(e: any) =>
                              subField.handleChange(
                                e.target.value === ''
                                  ? 0
                                  : Number(e.target.value)
                              )
                            }
                          />
                        )}
                      />

                      <form.AppField
                        name={`items[${i}].returned_quantity`}
                        children={(subField: any) => (
                          <subField.TextField
                            type="number"
                            label="Jumlah Return"
                            value={
                              subField.state.value ?? ''
                            }
                            onChange={(e: any) =>
                              subField.handleChange(
                                e.target.value === ''
                                  ? 0
                                  : Number(e.target.value)
                              )
                            }
                          />
                        )}
                      />

                      <form.AppField
                        name={`items[${i}].processing_fee`}
                        children={(subField: any) => (
                          <subField.TextField
                            type="number"
                            label="Processing Fee Item"
                            value={
                              subField.state.value ?? ''
                            }
                            onChange={(e: any) =>
                              subField.handleChange(
                                e.target.value === ''
                                  ? 0
                                  : Number(e.target.value)
                              )
                            }
                          />
                        )}
                      />

                      <form.AppField
                        name={`items[${i}].product_cost_amount`}
                        children={(subField: any) => (
                          <subField.TextField
                            type="number"
                            label="Product Cost Amount"
                            value={
                              subField.state.value ?? ''
                            }
                            onChange={(e: any) =>
                              subField.handleChange(
                                e.target.value === ''
                                  ? 0
                                  : Number(e.target.value)
                              )
                            }
                          />
                        )}
                      />
                    </div>
                  </div>
                )
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  field.pushValue({
                    product: '',
                    product_name: '',
                    variation_name: '',
                    parent_sku: '',
                    sku_reference_number: '',
                    product_key: '',
                    original_price: 0,
                    price_after_discount: 0,
                    quantity: 1,
                    returned_quantity: 0,
                    processing_fee: 0,
                    product_cost_amount: 0,
                  })
                }
                className="mt-2 w-full border-dashed"
              >
                <Plus className="mr-2 h-4 w-4" /> Tambah
                Item Produk
              </Button>
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
}
