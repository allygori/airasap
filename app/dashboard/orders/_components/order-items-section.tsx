import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { useStore } from '@tanstack/react-form';
import { formatDate } from '@/lib/formatter/date';
import { formatIDR } from '@/lib/formatter';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function OrderItemsSection({ form }: { form: any }) {
  const items = useStore(
    form.store,
    (state: any) => state.values.items
  );

  const getCosts = useMemo(() => {
    return (index: number, variantName?: string) => {
      return items[index].product?.variants?.length === 1
        ? items[index].product?.variants[0]?.costs || []
        : items[index].product?.variants?.find(
            (item: { name: string }) =>
              item.name === variantName
          )?.costs || [];
    };
  }, [
    // field.state.value[i]?.product?.variants,
    items,
  ]);

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
                    {/* <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 absolute top-3 right-3"
                      onClick={() => field.removeValue(i)}
                    >
                      <X className="h-4 w-4" />
                    </Button> */}

                    <h4 className="text-muted-foreground text-sm font-semibold">
                      Item #{i + 1}
                    </h4>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                      {/* <form.AppField
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
                      /> */}

                      <form.AppField
                        name={`items[${i}].product_name`}
                        children={(subField: any) => (
                          <subField.TextField
                            label="Nama Produk"
                            className="col-span-3"
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
                        name={`items[${i}].product_cost`}
                        children={(subField: any) => (
                          <subField.TextField
                            type="number"
                            label="HPP"
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

                      <pre>
                        {JSON.stringify(
                          getCosts(
                            0,
                            field.state.value[i]
                              .variation_name
                          ),
                          null,
                          2
                        )}
                      </pre>

                      {/* {costField.state.value?.map(
                        (_cost: any, costIndex: number) => {
                          const isActive =
                            currentDefaultCost ===
                              _cost.cogs_unit &&
                            _cost.cogs_unit !== 0;

                          return (
                            <div
                              key={costIndex}
                              role="button"
                              tabIndex={0}
                              className={cn(
                                'grid cursor-pointer grid-cols-1 items-end gap-3 rounded-md border p-3 transition-all md:grid-cols-[auto_1fr_1.5fr_auto]',
                                isActive
                                  ? 'border-primary bg-primary/5 ring-primary/20 ring-1'
                                  : 'border-border bg-muted/30 hover:border-muted-foreground/30'
                              )}
                              onClick={() => {
                                form.setFieldValue(
                                  `variants[${i}].default_cost`,
                                  _cost.cogs_unit
                                );
                              }}
                              onKeyDown={(e: any) => {
                                if (
                                  e.key === 'Enter' ||
                                  e.key === ' '
                                ) {
                                  e.preventDefault();
                                  form.setFieldValue(
                                    `variants[${i}].default_cost`,
                                    _cost.cogs_unit
                                  );
                                }
                              }}
                            >
                              <div className="flex flex-col items-center justify-center gap-1.5 pt-5">
                                {isActive ? (
                                  <CircleCheck className="text-primary h-5 w-5" />
                                ) : (
                                  <Circle className="text-muted-foreground/40 h-5 w-5" />
                                )}
                                {isActive && (
                                  <Badge
                                    variant="default"
                                    className="text-tiny"
                                  >
                                    Aktif
                                  </Badge>
                                )}
                              </div>

                              <form.AppField
                                name={`variants[${i}].costs[${costIndex}].cogs_unit`}
                                children={(
                                  subField: any
                                ) => (
                                  <subField.TextField
                                    type="number"
                                    label="HPP / Unit"
                                    value={
                                      subField.state
                                        .value ?? ''
                                    }
                                    onChange={(e: any) => {
                                      const newValue =
                                        e.target.value ===
                                        ''
                                          ? 0
                                          : Number(
                                              e.target.value
                                            );
                                      // If this cost was the active default, update default_cost to new value
                                      if (isActive) {
                                        form.setFieldValue(
                                          `variants[${i}].default_cost`,
                                          newValue
                                        );
                                      }
                                      subField.handleChange(
                                        newValue
                                      );
                                    }}
                                    onClick={(e: any) =>
                                      e.stopPropagation()
                                    }
                                  />
                                )}
                              />
                              <form.AppField
                                name={`variants[${i}].costs[${costIndex}].notes`}
                                children={(
                                  subField: any
                                ) => (
                                  <subField.TextField
                                    label="Catatan"
                                    value={
                                      subField.state
                                        .value ?? ''
                                    }
                                    onChange={(e: any) =>
                                      subField.handleChange(
                                        e.target.value
                                      )
                                    }
                                    onClick={(e: any) =>
                                      e.stopPropagation()
                                    }
                                  />
                                )}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={(e: any) => {
                                  e.stopPropagation();
                                  // If deleting the active cost, reset default_cost
                                  if (isActive) {
                                    form.setFieldValue(
                                      `variants[${i}].default_cost`,
                                      0
                                    );
                                  }
                                  costField.removeValue(
                                    costIndex
                                  );
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        }
                      )} */}
                    </div>
                  </div>
                )
              )}

              {/* <Button
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
              </Button> */}
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
}
