'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { z } from 'zod';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FinanceOfflineSaleResponseSchema,
  type FinanceOfflineSaleFormOptionsDTO,
} from '@/modules/finance/client';

const ApiResponseSchema = z.object({
  success: z.literal(true),
  data: FinanceOfflineSaleResponseSchema,
});

type DraftLine = {
  key: number;
  product_key: string;
  quantity: string;
  unit_price: string;
};

export function FinanceOfflineSaleForm({
  options,
  initialDate,
}: {
  options: FinanceOfflineSaleFormOptionsDTO;
  initialDate: string;
}) {
  const router = useRouter();
  const idempotencyKey = useRef<string | null>(null);
  const [lines, setLines] = useState<DraftLine[]>([
    {
      key: 1,
      product_key: '',
      quantity: '1',
      unit_price: '',
    },
  ]);
  const [paymentAccountId, setPaymentAccountId] =
    useState('');
  const [transactionDate, setTransactionDate] =
    useState(initialDate);
  const [reference, setReference] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const total = lines.reduce((sum, line) => {
    const quantity = Number(line.quantity);
    const price = Number(line.unit_price);
    return (
      sum +
      (quantity > 0 && price > 0 ? quantity * price : 0)
    );
  }, 0);

  const updateLine = (
    key: number,
    patch: Partial<Omit<DraftLine, 'key'>>
  ) =>
    setLines((current) =>
      current.map((line) =>
        line.key === key ? { ...line, ...patch } : line
      )
    );

  const submit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const selectedLines = lines.map((line) => {
      const product = options.products.find(
        (option) => option.key === line.product_key
      );
      return { line, product };
    });
    if (selectedLines.some(({ product }) => !product)) {
      setError(
        'Pilih produk untuk setiap baris penjualan.'
      );
      return;
    }
    if (!paymentAccountId) {
      setError('Pilih akun penerimaan pembayaran.');
      return;
    }
    if (!idempotencyKey.current) {
      idempotencyKey.current = crypto.randomUUID();
    }

    setWorking(true);
    try {
      const response = await fetch(
        '/api/v1/dashboard/finance/sales/offline',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idempotency_key: idempotencyKey.current,
            transaction_date: transactionDate,
            payment_account_id: paymentAccountId,
            ...(reference.trim()
              ? { reference: reference.trim() }
              : {}),
            lines: selectedLines.map(
              ({ line, product }) => ({
                product_id: product!.product_id,
                ...(product!.variant_id
                  ? { variant_id: product!.variant_id }
                  : {}),
                quantity: Number(line.quantity),
                unit_price: Number(line.unit_price),
              })
            ),
          }),
        }
      );
      const payload: unknown = await response.json();
      if (!response.ok) {
        setError(getErrorMessage(payload));
        return;
      }
      const parsed = ApiResponseSchema.safeParse(payload);
      if (!parsed.success) {
        setError('Respons server Finance tidak valid.');
        return;
      }
      const result = parsed.data.data.result;
      if (
        result.status === 'posted' &&
        result.transaction_id
      ) {
        router.push(
          `/dashboard/finance/sales/${result.transaction_id}`
        );
        router.refresh();
        return;
      }
      setNotice(
        result.reason ??
          'Penjualan belum dapat diposting. Periksa detail transaksi Finance.'
      );
      if (result.transaction_id) {
        router.push(
          `/dashboard/finance/sales/${result.transaction_id}`
        );
      }
    } catch {
      setError('Tidak dapat menghubungi server Finance.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/dashboard/finance/sales"
            className="text-primary text-sm underline-offset-4 hover:underline"
          >
            ← Kembali ke penjualan
          </Link>
          <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
            Finance / Penjualan
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Penjualan offline
          </h1>
          <p className="text-muted-foreground max-w-2xl leading-7">
            Catat penjualan langsung atau WhatsApp. Finance
            akan mencatat penerimaan, pendapatan, HPP, dan
            pengurangan stok dalam satu alur.
          </p>
        </div>
        <Link
          href="/dashboard/finance/inventory/product-and-stock-list"
          className={buttonVariants({ variant: 'outline' })}
        >
          Lihat stok
        </Link>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Penjualan belum tersimpan</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {notice ? (
        <Alert>
          <AlertTitle>Perlu ditinjau</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}

      {options.products.length === 0 ||
      options.payment_accounts.length === 0 ? (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>
              Belum siap mencatat penjualan
            </CardTitle>
            <CardDescription>
              Siapkan stok Finance yang sudah dimapping,
              catat saldo awal, dan pastikan hanya ada satu
              lokasi inventory aktif. Akun Kas, Bank, atau
              E-wallet juga harus tersedia.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/finance/inventory/setup"
              className={buttonVariants()}
            >
              Siapkan produk dan stok
            </Link>
            <Link
              href="/dashboard/finance/accounting/chart-of-accounts"
              className={buttonVariants({
                variant: 'outline',
              })}
            >
              Periksa akun Kas/Bank
            </Link>
            <Link
              href="/dashboard/finance/onboarding"
              className={buttonVariants({
                variant: 'ghost',
              })}
            >
              Buka saldo awal Finance
            </Link>
          </CardFooter>
        </Card>
      ) : (
        <form
          onSubmit={submit}
          className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]"
        >
          <Card>
            <CardHeader>
              <CardTitle>Detail penjualan</CardTitle>
              <CardDescription>
                Pilih produk, jumlah terjual, dan harga jual
                per unit. Stok tersedia sudah
                memperhitungkan pesanan marketplace yang
                sedang berjalan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                {lines.map((line, index) => {
                  const selectedProduct =
                    options.products.find(
                      (product) =>
                        product.key === line.product_key
                    );
                  return (
                    <div
                      key={line.key}
                      className="bg-muted/30 grid gap-4 rounded-xl border p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">
                          Produk {index + 1}
                        </p>
                        {lines.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setLines((current) =>
                                current.filter(
                                  (item) =>
                                    item.key !== line.key
                                )
                              )
                            }
                          >
                            Hapus
                          </Button>
                        ) : null}
                      </div>
                      <Field>
                        <FieldLabel
                          htmlFor={`product-${line.key}`}
                        >
                          Produk
                        </FieldLabel>
                        <Select
                          value={line.product_key}
                          onValueChange={(value) =>
                            updateLine(line.key, {
                              product_key: value ?? '',
                            })
                          }
                        >
                          <SelectTrigger
                            id={`product-${line.key}`}
                            className="w-full"
                          >
                            <SelectValue placeholder="Pilih produk yang stoknya tersedia" />
                          </SelectTrigger>
                          <SelectContent>
                            {options.products.map(
                              (product) => (
                                <SelectItem
                                  key={product.key}
                                  value={product.key}
                                >
                                  {product.product_name}
                                  {product.variant_name
                                    ? ` — ${product.variant_name}`
                                    : ''}{' '}
                                  · tersedia{' '}
                                  {
                                    product.available_quantity
                                  }{' '}
                                  {product.unit}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                        {selectedProduct ? (
                          <FieldDescription>
                            Item stok:{' '}
                            {
                              selectedProduct.inventory_item_name
                            }
                            {selectedProduct.inventory_sku
                              ? ` · ${selectedProduct.inventory_sku}`
                              : ''}
                          </FieldDescription>
                        ) : null}
                      </Field>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field>
                          <FieldLabel
                            htmlFor={`quantity-${line.key}`}
                          >
                            Jumlah
                          </FieldLabel>
                          <Input
                            id={`quantity-${line.key}`}
                            type="number"
                            min={1}
                            max={
                              selectedProduct?.available_quantity
                            }
                            step={1}
                            required
                            value={line.quantity}
                            onChange={(event) =>
                              updateLine(line.key, {
                                quantity:
                                  event.target.value,
                              })
                            }
                          />
                          <FieldDescription>
                            Maksimum sesuai stok yang
                            tersedia.
                          </FieldDescription>
                        </Field>
                        <Field>
                          <FieldLabel
                            htmlFor={`unit-price-${line.key}`}
                          >
                            Harga per unit (Rp)
                          </FieldLabel>
                          <Input
                            id={`unit-price-${line.key}`}
                            type="number"
                            min={1}
                            step={1}
                            required
                            value={line.unit_price}
                            onChange={(event) =>
                              updateLine(line.key, {
                                unit_price:
                                  event.target.value,
                              })
                            }
                            placeholder="Contoh: 125000"
                          />
                        </Field>
                      </div>
                    </div>
                  );
                })}
                <Button
                  type="button"
                  variant="outline"
                  className="w-fit"
                  onClick={() =>
                    setLines((current) => [
                      ...current,
                      {
                        key:
                          Math.max(
                            ...current.map(
                              (line) => line.key
                            )
                          ) + 1,
                        product_key: '',
                        quantity: '1',
                        unit_price: '',
                      },
                    ])
                  }
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
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="payment-account">
                      Akun penerimaan
                    </FieldLabel>
                    <Select
                      value={paymentAccountId}
                      onValueChange={(value) =>
                        setPaymentAccountId(value ?? '')
                      }
                    >
                      <SelectTrigger
                        id="payment-account"
                        className="w-full"
                      >
                        <SelectValue placeholder="Pilih Kas/Bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.payment_accounts.map(
                          (account) => (
                            <SelectItem
                              key={account.id}
                              value={account.id}
                            >
                              {account.name} ·{' '}
                              {account.subtype}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="transaction-date">
                      Tanggal transaksi
                    </FieldLabel>
                    <Input
                      id="transaction-date"
                      type="date"
                      required
                      value={transactionDate}
                      onChange={(event) =>
                        setTransactionDate(
                          event.target.value
                        )
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="sale-reference">
                      Nomor nota (opsional)
                    </FieldLabel>
                    <Input
                      id="sale-reference"
                      value={reference}
                      maxLength={100}
                      onChange={(event) =>
                        setReference(event.target.value)
                      }
                      placeholder="Contoh: OFF-024"
                    />
                  </Field>
                </FieldGroup>
              </CardContent>
              <CardFooter className="flex-col items-stretch gap-4 border-t pt-5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Total penjualan
                  </span>
                  <span className="text-xl font-bold tabular-nums">
                    {formatRupiah(total)}
                  </span>
                </div>
                <Button
                  type="submit"
                  disabled={working || total <= 0}
                >
                  {working
                    ? 'Mencatat…'
                    : 'Simpan & posting penjualan'}
                </Button>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Penjualan diposting langsung. Jurnal tidak
                  diedit; koreksi dilakukan dengan transaksi
                  reversal.
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Pajak belum dipisahkan pada fase ini;
                  harga yang dimasukkan dicatat sebagai
                  nilai penjualan.
                </p>
              </CardFooter>
            </Card>
          </div>
        </form>
      )}
    </div>
  );
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function getErrorMessage(payload: unknown) {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'error' in payload
  ) {
    const error = (payload as { error?: unknown }).error;
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message ===
        'string'
    ) {
      return (error as { message: string }).message;
    }
  }
  return 'Penjualan offline gagal diproses.';
}
