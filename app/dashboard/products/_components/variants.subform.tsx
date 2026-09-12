import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  X,
  CircleCheck,
  Circle,
  Layers,
} from 'lucide-react';
import { useAppForm } from '@/components/form/form.hook';
import { useStore } from '@tanstack/react-form';
import { useState } from 'react';
import { cn } from '@/lib/utils/ui';

const newCost = () => ({
  effective_from: new Date().toISOString(),
  cogs_unit: 0,
  notes: '',
});

// const newVariant = () => ({
//   variant_id: '',
//   name: '',
//   price: 0,
//   discount: 0,
//   final_price: 0,
//   parent_sku: '',
//   sku: '',
//   gtin: '',
//   is_default: false,
//   default_cost: 0,
//   costs: [newCost()],
// });

export function VariantsSubForm({ form }: { form: any }) {
  const variants = useStore(
    form.store,
    (state: any) => state.values.variants
  );

  const [bulkResult, setBulkResult] = useState<
    string | null
  >(null);

  const bulkForm = useAppForm({
    defaultValues: {
      cogs_unit: 0,
      notes: '',
      effective_from: new Date().toISOString(),
      set_as_default: false,
    },
    onSubmit: async ({ value }) => {
      if (value.cogs_unit <= 0) return;

      const currentVariants: any[] =
        form.getFieldValue('variants') ?? [];
      let applied = 0;
      let skipped = 0;

      currentVariants.forEach((_: any, i: number) => {
        const existingCosts: any[] =
          form.getFieldValue(`variants[${i}].costs`) ?? [];
        const alreadyExists = existingCosts.some(
          (cost: any) => cost.cogs_unit === value.cogs_unit
        );

        if (alreadyExists) {
          skipped++;
          if (value.set_as_default) {
            form.setFieldValue(
              `variants[${i}].default_cost`,
              value.cogs_unit
            );
          }
          return;
        }

        form.pushFieldValue(`variants[${i}].costs`, {
          effective_from: value.effective_from,
          cogs_unit: value.cogs_unit,
          notes: value.notes,
        });

        if (value.set_as_default) {
          form.setFieldValue(
            `variants[${i}].default_cost`,
            value.cogs_unit
          );
        }

        applied++;
      });

      setBulkResult(
        `${applied} varian diperbarui${skipped > 0 ? `, ${skipped} dilewati (HPP sudah ada)` : ''}`
      );
      setTimeout(() => setBulkResult(null), 4000);
    },
  });

  const bulkCogsUnit = useStore(
    bulkForm.store,
    (state: any) => state.values.cogs_unit
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Bulk update section */}
      <div className="border-muted-foreground/30 bg-primary-50 rounded-md border border-dashed p-4 px-4 dark:bg-gray-950">
        <div className="mb-3 flex items-center gap-2">
          <Layers className="text-muted-foreground h-4 w-4" />
          <h5 className="text-sm font-medium">
            Update Massal HPP
          </h5>
          <span className="text-muted-foreground text-xs">
            — Terapkan ke semua varian
          </span>
        </div>

        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_1fr_auto]">
          <bulkForm.AppField
            name="cogs_unit"
            children={(field) => (
              <field.TextField
                type="number"
                min={0}
                label="HPP / Unit"
                placeholder="Masukkan HPP..."
                value={field.state.value || ''}
                onChange={(event: any) =>
                  field.handleChange(
                    event.target.value === ''
                      ? 0
                      : Number(event.target.value)
                  )
                }
              />
            )}
          />
          <bulkForm.AppField
            name="effective_from"
            children={(field) => (
              <field.DateTimeField label="Mulai Berlaku" />
            )}
          />
          <div className="col-span-full">
            <bulkForm.AppField
              name="notes"
              children={(field) => (
                <field.TextareaField
                  label="Catatan"
                  placeholder="Catatan opsional..."
                  rows={2}
                  value={field.state.value}
                  onChange={(event: any) =>
                    field.handleChange(event.target.value)
                  }
                />
              )}
            />
          </div>
          <bulkForm.AppField
            name="set_as_default"
            children={(field) => (
              <field.SwitchField
                label="Jadikan HPP aktif"
                description="Aktifkan untuk semua varian."
                className="md:col-span-2"
              />
            )}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => bulkForm.handleSubmit()}
            disabled={bulkCogsUnit <= 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            Terapkan
          </Button>
        </div>

        {bulkResult && (
          <p className="text-muted-foreground mt-2 text-xs">
            ✓ {bulkResult}
          </p>
        )}
      </div>
      <form.AppField
        name="variants"
        mode="array"
        children={(field: any) => (
          <Accordion
            multiple
            className="dark:bg-muted/20 rounded-md border bg-white px-4"
          >
            {field.state.value?.map((_: any, i: number) => {
              const currentDefaultCost =
                variants[i]?.default_cost;

              return (
                <AccordionItem
                  key={i}
                  value={variants[i]?.variant_id ?? i}
                  className="border-0"
                >
                  <AccordionTrigger className="py-4 hover:no-underline">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <h4 className="text-sm font-semibold">
                        Variant #{i + 1} —{' '}
                        {variants[i]?.name}
                      </h4>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pb-4">
                    <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <form.AppField
                        name={`variants[${i}].is_native`}
                        children={(subField: any) => (
                          <subField.SwitchField
                            label="Is Native Variant?"
                            description="Matikan untuk menandai produk alternatif/cross-selling."
                            className="bg-muted/20 col-span-full rounded-md border p-3"
                          />
                        )}
                      />

                      <form.AppField
                        name={`variants[${i}].name`}
                        children={(subField: any) => (
                          <subField.TextField
                            label="Nama Variant"
                            value={
                              subField.state.value ?? ''
                            }
                            disabled={true}
                            className="col-span-full"
                            onChange={(e: any) =>
                              subField.handleChange(
                                e.target.value
                              )
                            }
                          />
                        )}
                      />

                      <form.AppField
                        name={`variants[${i}].name_history`}
                        children={(subField: any) => (
                          <subField.StringArrayField
                            label="Riwayat Judul Variant"
                            description="Satu judul lama per baris. Dipakai importer sebagai fallback pencarian variant."
                            placeholder="Satu judul lama per baris"
                            rows={3}
                            className="col-span-full"
                          />
                        )}
                      />

                      <form.AppField
                        name={`variants[${i}].variant_id`}
                        children={(subField: any) => (
                          <subField.TextField
                            label="Variant ID"
                            value={
                              subField.state.value ?? ''
                            }
                            disabled={true}
                            onChange={(e: any) =>
                              subField.handleChange(
                                e.target.value
                              )
                            }
                          />
                        )}
                      />

                      <form.AppField
                        name={`variants[${i}].child_sku`}
                        children={(subField: any) => (
                          <subField.TextField
                            label="Child SKU"
                            value={
                              subField.state.value ?? ''
                            }
                            disabled={true}
                            onChange={(e: any) =>
                              subField.handleChange(
                                e.target.value
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
                            value={
                              subField.state.value ?? ''
                            }
                            onChange={(e: any) => {
                              console.log(
                                form.getFieldValue(
                                  `variants[${i}].price`
                                )
                              );
                              return subField.handleChange(
                                e.target.value === ''
                                  ? 0
                                  : Number(e.target.value)
                              );
                            }}
                          />
                        )}
                      />
                      <form.AppField
                        name={`variants[${i}].price`}
                        children={(subField: any) => (
                          <subField.TextField
                            type="number"
                            label="Harga Jual"
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
                        name={`variants[${i}].final_price`}
                        children={(subField: any) => (
                          <subField.TextField
                            type="number"
                            label="Harga Jual (Final)"
                            value={
                              form.getFieldValue(
                                `variants[${i}].price`
                              ) *
                              (1 -
                                form.getFieldValue(
                                  `variants[${i}].discount`
                                ) /
                                  100)
                            }
                            disabled={true}
                            onChange={(e: any) => {
                              return subField.handleChange(
                                e.target.value === ''
                                  ? 0
                                  : Number(e.target.value)
                              );
                            }}
                          />
                        )}
                      />

                      {/* <form.AppField
                        name={`variants[${i}].parent_sku`}
                        children={(subField: any) => (
                          <subField.TextField
                            label="Parent SKU"
                            value={
                              subField.state.value ?? ''
                            }
                            disabled={true}
                            onChange={(e: any) =>
                              subField.handleChange(
                                e.target.value
                              )
                            }
                          />
                        )}
                      /> */}

                      <form.AppField
                        name={`variants[${i}].gtin`}
                        children={(subField: any) => (
                          <subField.TextField
                            label="GTIN"
                            value={
                              subField.state.value ?? ''
                            }
                            disabled={true}
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
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <h5 className="text-sm font-medium">
                                Riwayat HPP
                              </h5>
                              <p className="text-muted-foreground mt-1 text-xs">
                                Pilih satu HPP aktif untuk
                                perhitungan laporan.
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto"
                              onClick={() =>
                                costField.pushValue(
                                  newCost()
                                )
                              }
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Tambah HPP
                            </Button>
                          </div>

                          {costField.state.value?.map(
                            (
                              _cost: any,
                              costIndex: number
                            ) => {
                              const isActive =
                                currentDefaultCost ===
                                  _cost.cogs_unit &&
                                _cost.cogs_unit !== 0;

                              return (
                                <div
                                  key={costIndex}
                                  className={cn(
                                    'relative grid grid-cols-1 items-end gap-4 rounded-md border p-3 pt-14 transition-all sm:grid-cols-[minmax(10rem,1fr)_minmax(14rem,1.5fr)] sm:pt-14',
                                    isActive
                                      ? 'border-primary bg-primary/5 ring-primary/20 ring-1'
                                      : 'border-border bg-muted/30 hover:border-muted-foreground/30'
                                  )}
                                >
                                  <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-3">
                                    {/* Set default: stays on the left without taking a grid column. */}
                                    <div className="flex min-w-0 items-center gap-2">
                                      <button
                                        type="button"
                                        className="focus-visible:ring-ring rounded-full focus-visible:ring-2 focus-visible:outline-none"
                                        aria-label={
                                          isActive
                                            ? 'HPP aktif'
                                            : 'Jadikan HPP aktif'
                                        }
                                        aria-pressed={
                                          isActive
                                        }
                                        onClick={() =>
                                          form.setFieldValue(
                                            `variants[${i}].default_cost`,
                                            _cost.cogs_unit
                                          )
                                        }
                                      >
                                        {isActive ? (
                                          <CircleCheck className="text-primary h-5 w-5" />
                                        ) : (
                                          <Circle className="text-muted-foreground/40 h-5 w-5" />
                                        )}
                                      </button>
                                      {isActive && (
                                        <Badge
                                          variant="default"
                                          className="text-tiny"
                                        >
                                          Aktif
                                        </Badge>
                                      )}
                                    </div>

                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      aria-label="Hapus HPP"
                                      className="text-destructive hover:bg-destructive/10 shrink-0"
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
                                      <X />
                                    </Button>
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
                                        onChange={(
                                          e: any
                                        ) => {
                                          const newValue =
                                            e.target
                                              .value === ''
                                              ? 0
                                              : Number(
                                                  e.target
                                                    .value
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

                                  {/* <div className="sm:col-span-2"> */}
                                  <form.AppField
                                    name={`variants[${i}].costs[${costIndex}].effective_from`}
                                    children={(
                                      subField: any
                                    ) => (
                                      <subField.DateTimeField
                                        label="Mulai Berlaku"
                                        // description="Tanggal dan waktu mulai HPP ini digunakan."
                                      />
                                    )}
                                  />
                                  {/* </div> */}
                                  <form.AppField
                                    name={`variants[${i}].costs[${costIndex}].notes`}
                                    children={(
                                      subField: any
                                    ) => (
                                      <div className="col-span-full">
                                        <subField.TextareaField
                                          label="Catatan"
                                          rows={2}
                                          value={
                                            subField.state
                                              .value ?? ''
                                          }
                                          onChange={(
                                            e: any
                                          ) =>
                                            subField.handleChange(
                                              e.target.value
                                            )
                                          }
                                          onClick={(
                                            e: any
                                          ) =>
                                            e.stopPropagation()
                                          }
                                        />
                                      </div>
                                    )}
                                  />
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      />
    </div>
  );
}
