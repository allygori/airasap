import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Plus, X } from 'lucide-react';

const today = () =>
  new Date().toISOString().substring(0, 10);

const newCost = () => ({
  effective_from: today(),
  cogs_unit: 0,
  notes: '',
});

const newVariant = () => ({
  variant_id: '',
  name: '',
  price: 0,
  discount: 0,
  final_price: 0,
  parent_sku: '',
  sku: '',
  gtin: '',
  is_default: false,
  costs: [newCost()],
});

export function VariantsSubForm({ form }: { form: any }) {
  return (
    <form.AppField
      name="variants"
      mode="array"
      children={(field: any) => (
        <div className="flex flex-col gap-5">
          {field.state.value?.map((_: any, i: number) => (
            <div
              key={i}
              className="border-border relative rounded-lg border p-4"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold">
                    Variant #{i + 1}
                  </h4>
                  <p className="text-muted-foreground text-xs">
                    Harga jual dan riwayat HPP untuk variant
                    ini.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => field.removeValue(i)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <form.AppField
                  name={`variants[${i}].variant_id`}
                  children={(subField: any) => (
                    <subField.TextField
                      label="Variant ID"
                      value={subField.state.value ?? ''}
                      onChange={(e: any) =>
                        subField.handleChange(
                          e.target.value
                        )
                      }
                    />
                  )}
                />
                <form.AppField
                  name={`variants[${i}].name`}
                  children={(subField: any) => (
                    <subField.TextField
                      label="Nama Variant"
                      value={subField.state.value ?? ''}
                      onChange={(e: any) =>
                        subField.handleChange(
                          e.target.value
                        )
                      }
                    />
                  )}
                />
                <form.AppField
                  name={`variants[${i}].price`}
                  children={(subField: any) => (
                    <subField.TextField
                      type="number"
                      label="Harga Jual"
                      value={subField.state.value ?? ''}
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
                  name={`variants[${i}].discount`}
                  children={(subField: any) => (
                    <subField.TextField
                      type="number"
                      label="Diskon (%)"
                      value={subField.state.value ?? ''}
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
                  name={`variants[${i}].parent_sku`}
                  children={(subField: any) => (
                    <subField.TextField
                      label="Parent SKU"
                      value={subField.state.value ?? ''}
                      onChange={(e: any) =>
                        subField.handleChange(
                          e.target.value
                        )
                      }
                    />
                  )}
                />
                <form.AppField
                  name={`variants[${i}].sku`}
                  children={(subField: any) => (
                    <subField.TextField
                      label="SKU"
                      value={subField.state.value ?? ''}
                      onChange={(e: any) =>
                        subField.handleChange(
                          e.target.value
                        )
                      }
                    />
                  )}
                />
                <form.AppField
                  name={`variants[${i}].gtin`}
                  children={(subField: any) => (
                    <subField.TextField
                      label="GTIN"
                      value={subField.state.value ?? ''}
                      onChange={(e: any) =>
                        subField.handleChange(
                          e.target.value
                        )
                      }
                    />
                  )}
                />
              </FieldGroup>

              <form.AppField
                name={`variants[${i}].costs`}
                mode="array"
                children={(costField: any) => (
                  <div className="mt-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <h5 className="text-sm font-medium">
                        Riwayat HPP
                      </h5>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          costField.pushValue(newCost())
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah HPP
                      </Button>
                    </div>

                    {costField.state.value?.map(
                      (_cost: any, costIndex: number) => (
                        <div
                          key={costIndex}
                          className="bg-muted/30 grid grid-cols-1 items-end gap-3 rounded-md p-3 md:grid-cols-[1fr_1fr_1.5fr_auto]"
                        >
                          <form.AppField
                            name={`variants[${i}].costs[${costIndex}].effective_from`}
                            children={(subField: any) => (
                              <subField.TextField
                                type="date"
                                label="Mulai Berlaku"
                                value={
                                  subField.state.value
                                    ? String(
                                        subField.state.value
                                      ).substring(0, 10)
                                    : ''
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
                            name={`variants[${i}].costs[${costIndex}].cogs_unit`}
                            children={(subField: any) => (
                              <subField.TextField
                                type="number"
                                label="HPP / Unit"
                                value={
                                  subField.state.value ?? ''
                                }
                                onChange={(e: any) =>
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
                            name={`variants[${i}].costs[${costIndex}].notes`}
                            children={(subField: any) => (
                              <subField.TextField
                                label="Catatan"
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
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() =>
                              costField.removeValue(
                                costIndex
                              )
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                )}
              />
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() => field.pushValue(newVariant())}
            className="w-full border-dashed"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Variant
          </Button>
        </div>
      )}
    />
  );
}
