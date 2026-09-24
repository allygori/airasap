/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import { useStore } from '@tanstack/react-form';
import Link from 'next/link';
import { withForm } from '@/components/form/form.hook';
import {
  Button,
  buttonVariants,
} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import type { FinanceOfflineSaleFormOptionsDTO } from '@/modules/finance/client';
import type { FinanceOfflineSaleFormValues } from './finance-offline-sale-form.schema';

type OfflineSaleFormProps = {
  options: FinanceOfflineSaleFormOptionsDTO;
  isSubmitting: boolean;
};

export function createOfflineSaleFormDefaults(
  options: FinanceOfflineSaleFormOptionsDTO,
  initialDate: string
): FinanceOfflineSaleFormValues {
  return {
    transaction_date: initialDate,
    payment_account_id:
      options.payment_accounts[0]?.id ?? '',
    reference: '',
    lines: [createOfflineSaleLine('initial-line')],
  };
}

export const OfflineSaleForm = withForm({
  defaultValues: {
    transaction_date: '',
    payment_account_id: '',
    reference: '',
    lines: [createOfflineSaleLine('initial-line')],
  } as FinanceOfflineSaleFormValues,
  props: {
    options: { products: [], payment_accounts: [] },
    isSubmitting: false,
  } as OfflineSaleFormProps,
  render: function Render({ form, options, isSubmitting }) {
    const lines = useStore(
      form.store,
      (state) => state.values.lines
    );
    const total = lines.reduce(
      (sum, line) =>
        sum +
        Number(line.quantity || 0) *
          Number(line.unit_price || 0),
      0
    );

    const addLine = () => {
      form.setFieldValue('lines', (current) => [
        ...current,
        createOfflineSaleLine(),
      ]);
    };

    const removeLine = (lineKey: string) => {
      form.setFieldValue('lines', (current) =>
        current.filter((line) => line.line_key !== lineKey)
      );
    };

    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
        className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]"
      >
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Detail penjualan</CardTitle>
            <CardDescription>
              Pilih produk, jumlah terjual, dan harga jual
              per unit. Stok tersedia sudah memperhitungkan
              pesanan marketplace yang sedang berjalan.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            <FieldGroup className="min-w-0">
              {lines.map((line, index) => {
                const selectedProduct =
                  options.products.find(
                    (product) =>
                      product.key === line.product_key
                  );

                return (
                  <div
                    key={line.line_key}
                    className="bg-muted/30 grid min-w-0 gap-4 rounded-xl border p-4"
                  >
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <p className="text-sm font-semibold">
                        Produk {index + 1}
                      </p>
                      {lines.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            removeLine(line.line_key)
                          }
                          aria-label={`Hapus produk ${index + 1}`}
                        >
                          Hapus
                        </Button>
                      ) : null}
                    </div>

                    <FieldGroup className="grid min-w-0 gap-4 sm:grid-cols-2">
                      <form.AppField
                        name={
                          `lines[${index}].product_key` as const
                        }
                        children={(field) => (
                          <field.SelectField
                            label="Produk"
                            placeholder="Pilih produk yang stoknya tersedia"
                            className="min-w-0 sm:col-span-2"
                            items={options.products.map(
                              (product) => ({
                                label: `${product.product_name}${
                                  product.variant_name
                                    ? ` — ${product.variant_name}`
                                    : ''
                                } · tersedia ${product.available_quantity} ${product.unit}`,
                                value: product.key,
                              })
                            )}
                          />
                        )}
                      />
                      {selectedProduct ? (
                        <p className="text-muted-foreground min-w-0 text-xs sm:col-span-2">
                          Item stok:{' '}
                          {
                            selectedProduct.inventory_item_name
                          }
                          {selectedProduct.inventory_sku
                            ? ` · ${selectedProduct.inventory_sku}`
                            : ''}
                        </p>
                      ) : null}
                      <form.AppField
                        name={
                          `lines[${index}].quantity` as const
                        }
                        children={(field) => (
                          <field.TextField
                            label="Jumlah"
                            type="number"
                            min={1}
                            max={
                              selectedProduct?.available_quantity
                            }
                            step={1}
                            inputMode="numeric"
                            placeholder="1"
                            description="Maksimum sesuai stok yang tersedia."
                            className="min-w-0"
                          />
                        )}
                      />
                      <form.AppField
                        name={
                          `lines[${index}].unit_price` as const
                        }
                        children={(field) => (
                          <field.MoneyField
                            label="Harga per unit"
                            type="number"
                            min={1}
                            max={1_000_000_000_000}
                            step={1}
                            inputMode="numeric"
                            placeholder="125000"
                            className="min-w-0"
                          />
                        )}
                      />
                    </FieldGroup>
                  </div>
                );
              })}

              <Button
                type="button"
                variant="outline"
                className="w-fit"
                disabled={
                  isSubmitting || lines.length >= 50
                }
                onClick={addLine}
              >
                Tambah produk
              </Button>
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pembayaran</CardTitle>
              <CardDescription>
                Pilih tempat dana diterima.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup className="min-w-0">
                <form.AppField
                  name="payment_account_id"
                  children={(field) => (
                    <field.SelectField
                      label="Akun penerimaan"
                      placeholder="Pilih Kas/Bank"
                      className="min-w-0"
                      items={options.payment_accounts.map(
                        (account) => ({
                          label: `${account.name} · ${account.subtype}`,
                          value: account.id,
                        })
                      )}
                    />
                  )}
                />
                <form.AppField
                  name="transaction_date"
                  children={(field) => (
                    <field.DateField
                      label="Tanggal transaksi"
                      valueType="string"
                      placeholder="Pilih tanggal"
                      required
                      className="min-w-0"
                      buttonClassName="w-full"
                    />
                  )}
                />
                <form.AppField
                  name="reference"
                  children={(field) => (
                    <field.TextField
                      label="Nomor nota (opsional)"
                      maxLength={100}
                      placeholder="Contoh: OFF-024"
                      className="min-w-0"
                    />
                  )}
                />
              </FieldGroup>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-4 border-t pt-5">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <span className="text-muted-foreground text-sm">
                  Total penjualan
                </span>
                <span className="text-right text-xl font-bold break-words tabular-nums">
                  {formatRupiah(total)}
                </span>
              </div>
              <Button
                type="submit"
                disabled={isSubmitting || total <= 0}
              >
                {isSubmitting
                  ? 'Mencatat…'
                  : 'Simpan & posting penjualan'}
              </Button>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Penjualan diposting langsung. Jurnal tidak
                diedit; koreksi dilakukan dengan transaksi
                reversal.
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Pajak belum dipisahkan pada fase ini; harga
                yang dimasukkan dicatat sebagai nilai
                penjualan.
              </p>
            </CardFooter>
          </Card>
          <Link
            href="/dashboard/finance/inventory/product-and-stock-list"
            className={buttonVariants({
              variant: 'outline',
            })}
          >
            Lihat stok
          </Link>
        </div>
      </form>
    );
  },
});

function createOfflineSaleLine(
  lineKey = crypto.randomUUID()
) {
  return {
    line_key: lineKey,
    product_key: '',
    quantity: '1',
    unit_price: '',
  };
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}
