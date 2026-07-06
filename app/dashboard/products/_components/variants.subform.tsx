import { Button } from '@/components/ui/button';
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  X,
  CircleCheck,
  Circle,
  Layers,
} from 'lucide-react';
import { useStore } from '@tanstack/react-form';
import { useState } from 'react';
import { cn } from '@/lib/utils/ui';

const newCost = () => ({
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
  default_cost: 0,
  costs: [newCost()],
});

export function VariantsSubForm({ form }: { form: any }) {
  const variants = useStore(
    form.store,
    (state: any) => state.values.variants
  );

  // Bulk update local state
  const [bulkCogsUnit, setBulkCogsUnit] =
    useState<number>(0);
  const [bulkNotes, setBulkNotes] = useState<string>('');
  const [bulkSetAsDefault, setBulkSetAsDefault] =
    useState<boolean>(false);
  const [bulkResult, setBulkResult] = useState<
    string | null
  >(null);

  const handleBulkApply = () => {
    if (bulkCogsUnit <= 0) return;

    const currentVariants: any[] =
      form.getFieldValue('variants') ?? [];
    let applied = 0;
    let skipped = 0;

    currentVariants.forEach((_: any, i: number) => {
      const existingCosts: any[] =
        form.getFieldValue(`variants[${i}].costs`) ?? [];

      // Check uniqueness: skip if cogs_unit already exists in this variant
      const alreadyExists = existingCosts.some(
        (c: any) => c.cogs_unit === bulkCogsUnit
      );

      if (alreadyExists) {
        skipped++;
        // Even if skipped, set as default if requested
        if (bulkSetAsDefault) {
          form.setFieldValue(
            `variants[${i}].default_cost`,
            bulkCogsUnit
          );
        }
        return;
      }

      // Push new cost to this variant
      form.pushFieldValue(`variants[${i}].costs`, {
        cogs_unit: bulkCogsUnit,
        notes: bulkNotes,
      });

      // Optionally set as default
      if (bulkSetAsDefault) {
        form.setFieldValue(
          `variants[${i}].default_cost`,
          bulkCogsUnit
        );
      }

      applied++;
    });

    setBulkResult(
      `${applied} varian diperbarui${skipped > 0 ? `, ${skipped} dilewati (HPP sudah ada)` : ''}`
    );

    // Auto-clear result after 4 seconds
    setTimeout(() => setBulkResult(null), 4000);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Bulk update section */}
      <div className="border-muted-foreground/30 bg-muted/20 rounded-md border border-dashed p-4">
        <div className="mb-3 flex items-center gap-2">
          <Layers className="text-muted-foreground h-4 w-4" />
          <h5 className="text-sm font-medium">
            Update Massal HPP
          </h5>
          <span className="text-muted-foreground text-xs">
            — Terapkan ke semua varian
          </span>
        </div>

        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_1.5fr_auto]">
          <Field>
            <FieldLabel>HPP / Unit</FieldLabel>
            <Input
              type="number"
              min={0}
              value={bulkCogsUnit || ''}
              onChange={(e) =>
                setBulkCogsUnit(
                  e.target.value === ''
                    ? 0
                    : Number(e.target.value)
                )
              }
              placeholder="Masukkan HPP..."
            />
          </Field>
          <Field>
            <FieldLabel>Catatan</FieldLabel>
            <Input
              value={bulkNotes}
              onChange={(e) => setBulkNotes(e.target.value)}
              placeholder="Catatan opsional..."
            />
          </Field>
          <Button
            type="button"
            variant="outline"
            onClick={handleBulkApply}
            disabled={bulkCogsUnit <= 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            Terapkan
          </Button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Checkbox
            id="bulk-set-default"
            checked={bulkSetAsDefault}
            onCheckedChange={(checked: boolean) =>
              setBulkSetAsDefault(checked)
            }
          />
          <label
            htmlFor="bulk-set-default"
            className="text-muted-foreground cursor-pointer text-xs"
          >
            Jadikan HPP aktif untuk semua varian
          </label>
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
            className="rounded-md border bg-white px-4 dark:bg-gray-950"
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
                        name={`variants[${i}].name`}
                        children={(subField: any) => (
                          <subField.TextField
                            label="Nama Variant"
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

                      <form.AppField
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
                      />
                      <form.AppField
                        name={`variants[${i}].sku`}
                        children={(subField: any) => (
                          <subField.TextField
                            label="SKU"
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
                          <div className="flex items-center justify-between gap-3">
                            <h5 className="text-sm font-medium">
                              Riwayat HPP
                            </h5>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
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
                                  {/* Radio indicator + badge */}
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
                                        onChange={(
                                          e: any
                                        ) =>
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
