/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import { withForm } from '@/components/form/form.hook';
import {
  Button,
  buttonVariants,
} from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import {
  createEmptyFinanceOpeningBalanceFormValues,
  createEmptyInventoryLine,
  getEligibleInventoryItems,
} from '../shared/finance-opening-balance.utils';
import {
  EmptyHint,
  SectionHeading,
} from '../shared/finance-opening-balance.shared';
import type { FinanceOpeningBalanceFormProps } from '../../finance-opening-balance.form';
import Link from 'next/link';

type Props = Pick<
  FinanceOpeningBalanceFormProps,
  | 'setup'
  | 'preparableProductCount'
  | 'isLoadingProductCount'
  | 'isPreparingProducts'
  | 'isRefreshingInventory'
  | 'productCountError'
  | 'onPrepareProducts'
  | 'onRefreshInventory'
> & { isBusy: boolean };

export const FinanceOpeningBalanceInventoryStep = withForm({
  defaultValues:
    createEmptyFinanceOpeningBalanceFormValues(),
  props: {
    setup: {
      options: { inventory_items: [], locations: [] },
    },
    isBusy: false,
    preparableProductCount: null,
    isLoadingProductCount: false,
    isPreparingProducts: false,
    isRefreshingInventory: false,
    productCountError: null,
    onPrepareProducts: () => undefined,
    onRefreshInventory: () => undefined,
  } as unknown as Props,
  render: function Render({
    form,
    setup,
    isBusy,
    preparableProductCount,
    isLoadingProductCount,
    isPreparingProducts,
    isRefreshingInventory,
    productCountError,
    onPrepareProducts,
    onRefreshInventory,
  }) {
    const eligibleItems = getEligibleInventoryItems(setup);

    return (
      <div className="grid min-w-0 gap-5">
        <SectionHeading
          title="Stok pada tanggal saldo awal"
          description="Masukkan kuantitas dan harga perolehan, bukan harga jual. Jika belum siap, Anda boleh melewati bagian ini."
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            disabled={
              preparableProductCount === null ||
              preparableProductCount === 0 ||
              isLoadingProductCount ||
              isPreparingProducts ||
              isRefreshingInventory ||
              isBusy
            }
            onClick={onPrepareProducts}
          >
            {isPreparingProducts ||
            isLoadingProductCount ? (
              <Spinner data-icon="inline-start" />
            ) : null}
            {isPreparingProducts
              ? 'Menyiapkan…'
              : isLoadingProductCount
                ? 'Memuat produk…'
                : preparableProductCount === null
                  ? 'Jumlah produk tidak tersedia'
                  : `Siapkan ${preparableProductCount} produk`}
          </Button>
          <Link
            href="/dashboard/finance/inventory/setup"
            className={buttonVariants({
              variant: 'outline',
            })}
            target="_blank"
            rel="noreferrer"
          >
            Kelola mapping
          </Link>
          <Button
            type="button"
            variant="secondary"
            disabled={isRefreshingInventory || isBusy}
            onClick={onRefreshInventory}
          >
            {isRefreshingInventory
              ? 'Memuat pilihan…'
              : 'Muat ulang pilihan'}
          </Button>
        </div>
        {productCountError ? (
          <p
            className="text-destructive text-sm"
            role="status"
          >
            {productCountError} Klik “Muat ulang pilihan”
            untuk mencoba lagi.
          </p>
        ) : null}

        {setup.options.inventory_items.length === 0 ||
        setup.options.locations.length === 0 ? (
          <EmptyHint>
            Item inventory dan lokasi belum siap. Buat
            keduanya jika ingin mencatat stok awal sekarang;
            jika tidak, Anda dapat lanjut tanpa mengisi stok
            awal.
          </EmptyHint>
        ) : null}

        <form.AppField
          name="inventory_lines"
          mode="array"
          children={(arrayField) => (
            <div className="grid min-w-0 gap-4">
              {arrayField.state.value.map((line, index) => {
                const item =
                  setup.options.inventory_items.find(
                    (option) =>
                      option.id === line.inventory_item_id
                  );

                return (
                  <div
                    key={line.line_key}
                    className="bg-muted/20 grid min-w-0 gap-4 rounded-xl border p-4 sm:p-5"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">
                          Item {index + 1}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Kuantitas dan nilai persediaan.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Hapus item ${index + 1}`}
                        disabled={isBusy}
                        onClick={() =>
                          arrayField.removeValue(index)
                        }
                      >
                        Hapus
                      </Button>
                    </div>
                    <FieldGroup className="grid min-w-0 gap-4 md:grid-cols-3">
                      <div className="min-w-0 md:col-span-3">
                        <form.AppField
                          name={
                            `inventory_lines[${index}].inventory_item_id` as const
                          }
                          children={(field) => (
                            <field.SelectField
                              label="Item inventory"
                              placeholder="Pilih item"
                              className="min-w-0"
                              disabled={isBusy}
                              items={eligibleItems.map(
                                (option) => ({
                                  value: option.id,
                                  label: `${option.sku} — ${option.name}`,
                                })
                              )}
                            />
                          )}
                        />
                      </div>
                      <form.AppField
                        name={
                          `inventory_lines[${index}].location_id` as const
                        }
                        children={(field) => (
                          <field.SelectField
                            label="Lokasi"
                            placeholder="Pilih lokasi"
                            className="min-w-0"
                            disabled={isBusy}
                            items={setup.options.locations.map(
                              (location) => ({
                                value: location.id,
                                label: `${location.code} — ${location.name}`,
                              })
                            )}
                          />
                        )}
                      />
                      <form.AppField
                        name={
                          `inventory_lines[${index}].quantity` as const
                        }
                        children={(field) => (
                          <field.TextField
                            label={`Jumlah${item ? ` (${item.unit})` : ''}`}
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={1_000_000}
                            step={1}
                            placeholder="0"
                            className="min-w-0"
                            disabled={isBusy}
                          />
                        )}
                      />
                      <form.AppField
                        name={
                          `inventory_lines[${index}].unit_cost` as const
                        }
                        children={(field) => (
                          <field.MoneyField
                            label="Harga per unit"
                            inputMode="numeric"
                            min={0}
                            placeholder="0"
                            className="min-w-0"
                            disabled={isBusy}
                          />
                        )}
                      />
                    </FieldGroup>
                  </div>
                );
              })}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-muted-foreground text-xs">
                  {arrayField.state.value.length === 0
                    ? 'Belum ada stok awal yang ditambahkan.'
                    : `${arrayField.state.value.length} baris stok awal`}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    isBusy ||
                    eligibleItems.length === 0 ||
                    setup.options.locations.length === 0
                  }
                  onClick={() =>
                    arrayField.pushValue(
                      createEmptyInventoryLine(setup)
                    )
                  }
                >
                  Tambah item stok
                </Button>
              </div>
            </div>
          )}
        />
      </div>
    );
  },
});
