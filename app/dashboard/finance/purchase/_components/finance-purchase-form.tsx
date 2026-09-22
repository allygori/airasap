'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FinancePurchaseResponseSchema,
  type FinancePurchaseListResponseDTO,
  type FinancePurchaseSummaryDTO,
} from '@/modules/finance';

type PurchaseItemOption = {
  id: string;
  sku: string;
  name: string;
  unit: string;
};

type PurchaseLocationOption = {
  id: string;
  code: string;
  name: string;
};

type PurchaseAccountOption = {
  id: string;
  code: string;
  name: string;
  subtype: string | null;
};

type PurchaseLine = {
  item_id: string;
  location_id: string;
  quantity: string;
  unit_cost: string;
};

const ActionResponseSchema = z.object({
  success: z.literal(true),
  data: FinancePurchaseResponseSchema,
});

const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({ message: z.string() }),
});

export function FinancePurchaseForm({
  items,
  locations,
  paymentAccounts,
  purchases,
}: {
  items: PurchaseItemOption[];
  locations: PurchaseLocationOption[];
  paymentAccounts: PurchaseAccountOption[];
  purchases: FinancePurchaseListResponseDTO;
}) {
  const router = useRouter();
  const [supplierName, setSupplierName] = useState('');
  const [supplierReference, setSupplierReference] =
    useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [paymentTiming, setPaymentTiming] = useState<
    'paid' | 'payable'
  >('paid');
  const [paymentAccountId, setPaymentAccountId] = useState(
    paymentAccounts[0]?.id ?? ''
  );
  const [lines, setLines] = useState<PurchaseLine[]>([
    {
      item_id: items[0]?.id ?? '',
      location_id: locations[0]?.id ?? '',
      quantity: '1',
      unit_cost: '',
    },
  ]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postingId, setPostingId] = useState<string | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);
  const [successMessage, setSuccessMessage] = useState<
    string | null
  >(null);

  const totalAmount = useMemo(
    () =>
      lines.reduce(
        (total, line) =>
          total +
          Number(line.quantity || 0) *
            Number(line.unit_cost || 0),
        0
      ),
    [lines]
  );

  const updateLine = (
    index: number,
    value: Partial<PurchaseLine>
  ) => {
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...value } : line
      )
    );
  };

  const submit = async (shouldPost: boolean) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const createResponse = await fetch(
        '/api/v1/dashboard/finance/purchases',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(supplierName.trim()
              ? { supplier_name: supplierName.trim() }
              : {}),
            ...(supplierReference.trim()
              ? {
                  supplier_reference:
                    supplierReference.trim(),
                }
              : {}),
            transaction_date: `${transactionDate}T00:00:00.000Z`,
            payment_timing: paymentTiming,
            ...(paymentTiming === 'paid'
              ? { payment_account_id: paymentAccountId }
              : {}),
            lines: lines.map((line) => ({
              item_id: line.item_id,
              location_id: line.location_id,
              quantity: Number(line.quantity),
              unit_cost: Number(line.unit_cost),
            })),
            ...(notes.trim()
              ? { notes: notes.trim() }
              : {}),
            idempotency_key: crypto.randomUUID(),
          }),
        }
      );
      const createPayload: unknown =
        await createResponse.json();
      if (!createResponse.ok) {
        setErrorMessage(getErrorMessage(createPayload));
        return;
      }

      const created =
        ActionResponseSchema.safeParse(createPayload);
      if (!created.success) {
        setErrorMessage(
          'Respons server Finance tidak valid.'
        );
        return;
      }

      if (shouldPost) {
        const postResponse = await fetch(
          `/api/v1/dashboard/finance/purchases/${created.data.data.purchase_id}/post`,
          { method: 'POST' }
        );
        const postPayload: unknown =
          await postResponse.json();
        if (!postResponse.ok) {
          setErrorMessage(
            `Draft tersimpan, tetapi posting gagal: ${getErrorMessage(postPayload)}`
          );
          router.refresh();
          return;
        }
        const posted =
          ActionResponseSchema.safeParse(postPayload);
        if (!posted.success) {
          setErrorMessage(
            'Respons posting Finance tidak valid.'
          );
          return;
        }
        setSuccessMessage(
          `Purchase posted sebesar ${formatMoney(posted.data.data.total_amount)}.`
        );
      } else {
        setSuccessMessage(
          'Draft purchase berhasil disimpan.'
        );
      }

      resetForm();
      router.refresh();
    } catch {
      setErrorMessage(
        'Tidak dapat menghubungi server Finance.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const postExisting = async (
    purchase: FinancePurchaseSummaryDTO
  ) => {
    setPostingId(purchase.purchase_id);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(
        `/api/v1/dashboard/finance/purchases/${purchase.purchase_id}/post`,
        { method: 'POST' }
      );
      const payload: unknown = await response.json();
      if (!response.ok) {
        setErrorMessage(getErrorMessage(payload));
        return;
      }
      const parsed =
        ActionResponseSchema.safeParse(payload);
      if (!parsed.success) {
        setErrorMessage(
          'Respons posting Finance tidak valid.'
        );
        return;
      }
      setSuccessMessage(
        'Draft purchase berhasil diposting.'
      );
      router.refresh();
    } catch {
      setErrorMessage(
        'Tidak dapat menghubungi server Finance.'
      );
    } finally {
      setPostingId(null);
    }
  };

  const resetForm = () => {
    setSupplierName('');
    setSupplierReference('');
    setNotes('');
    setLines([
      {
        item_id: items[0]?.id ?? '',
        location_id: locations[0]?.id ?? '',
        quantity: '1',
        unit_cost: '',
      },
    ]);
  };

  const hasSetup = items.length > 0 && locations.length > 0;

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
            Finance / Transaksi
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Purchase inventory
          </h1>
          <p className="text-muted-foreground leading-7">
            Catat barang masuk dari supplier sebagai
            inventory. Pilih apakah transaksi langsung
            dibayar atau menjadi Utang Usaha—Finance tidak
            akan menganggap purchase kredit sebagai
            pembayaran.
          </p>
        </div>
        <Link
          href="/dashboard/finance/inventory/product-and-stock-list"
          className="text-primary text-sm font-medium underline-offset-4 hover:underline"
        >
          Lihat saldo stok →
        </Link>
      </div>

      {!hasSetup ? (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>
              Setup inventory belum siap
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground leading-7">
            Buat minimal satu inventory item aktif dan satu
            lokasi aktif sebelum mencatat purchase.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.55fr)]">
          <Card className="max-w-4xl">
            <CardHeader className="border-b">
              <CardTitle>Purchase baru</CardTitle>
              <CardDescription>
                Simpan sebagai draft untuk dilengkapi nanti,
                atau simpan &amp; post ketika data sudah
                benar.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form
                className="grid gap-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submit(true);
                }}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">
                    Supplier (opsional)
                    <input
                      value={supplierName}
                      onChange={(event) =>
                        setSupplierName(event.target.value)
                      }
                      maxLength={160}
                      placeholder="Contoh: PT Distributor Nusantara"
                      className={InputClass}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    No. invoice / referensi
                    <input
                      value={supplierReference}
                      onChange={(event) =>
                        setSupplierReference(
                          event.target.value
                        )
                      }
                      maxLength={120}
                      placeholder="Contoh: INV-2026-001"
                      className={InputClass}
                    />
                  </label>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">
                    Tanggal transaksi
                    <input
                      type="date"
                      value={transactionDate}
                      onChange={(event) =>
                        setTransactionDate(
                          event.target.value
                        )
                      }
                      className={InputClass}
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Waktu pembayaran
                    <select
                      value={paymentTiming}
                      onChange={(event) =>
                        setPaymentTiming(
                          event.target.value as
                            | 'paid'
                            | 'payable'
                        )
                      }
                      className={InputClass}
                    >
                      <option value="paid">
                        Sudah dibayar
                      </option>
                      <option value="payable">
                        Jadi Utang Usaha
                      </option>
                    </select>
                  </label>
                </div>

                {paymentTiming === 'paid' ? (
                  <label className="grid gap-2 text-sm font-medium">
                    Dibayar dari
                    <select
                      value={paymentAccountId}
                      onChange={(event) =>
                        setPaymentAccountId(
                          event.target.value
                        )
                      }
                      className={InputClass}
                      required
                    >
                      {paymentAccounts.map((account) => (
                        <option
                          key={account.id}
                          value={account.id}
                        >
                          {account.code} — {account.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <div className="border-info/30 bg-info/5 text-info-foreground rounded-lg border px-4 py-3 text-sm leading-6">
                    Purchase akan dicatat ke Utang Usaha
                    2100. Pembayaran supplier akan
                    ditambahkan pada phase
                    settlement/payables.
                  </div>
                )}

                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        Barang yang dibeli
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Setiap line menjadi inventory
                        movement purchase saat diposting.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setLines((current) => [
                          ...current,
                          {
                            item_id: items[0]?.id ?? '',
                            location_id:
                              locations[0]?.id ?? '',
                            quantity: '1',
                            unit_cost: '',
                          },
                        ])
                      }
                    >
                      + Tambah line
                    </Button>
                  </div>

                  <div className="grid gap-3">
                    {lines.map((line, index) => (
                      <div
                        key={`${index}-${line.item_id}`}
                        className="bg-muted/25 grid gap-3 rounded-xl border p-4"
                      >
                        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_7rem_9rem_auto] lg:items-end">
                          <label className="grid gap-2 text-sm font-medium">
                            Item
                            <select
                              value={line.item_id}
                              onChange={(event) =>
                                updateLine(index, {
                                  item_id:
                                    event.target.value,
                                })
                              }
                              className={InputClass}
                              required
                            >
                              {items.map((item) => (
                                <option
                                  key={item.id}
                                  value={item.id}
                                >
                                  {item.sku} — {item.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="grid gap-2 text-sm font-medium">
                            Lokasi
                            <select
                              value={line.location_id}
                              onChange={(event) =>
                                updateLine(index, {
                                  location_id:
                                    event.target.value,
                                })
                              }
                              className={InputClass}
                              required
                            >
                              {locations.map((location) => (
                                <option
                                  key={location.id}
                                  value={location.id}
                                >
                                  {location.code} —{' '}
                                  {location.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="grid gap-2 text-sm font-medium">
                            Qty
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={line.quantity}
                              onChange={(event) =>
                                updateLine(index, {
                                  quantity:
                                    event.target.value,
                                })
                              }
                              className={InputClass}
                              required
                            />
                          </label>
                          <label className="grid gap-2 text-sm font-medium">
                            Harga/unit
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={line.unit_cost}
                              onChange={(event) =>
                                updateLine(index, {
                                  unit_cost:
                                    event.target.value,
                                })
                              }
                              placeholder="25000"
                              className={InputClass}
                              required
                            />
                          </label>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={lines.length === 1}
                            onClick={() =>
                              setLines((current) =>
                                current.filter(
                                  (_, lineIndex) =>
                                    lineIndex !== index
                                )
                              )
                            }
                          >
                            Hapus
                          </Button>
                        </div>
                        <p className="text-muted-foreground text-right text-xs">
                          Subtotal:{' '}
                          {formatMoney(
                            Number(line.quantity || 0) *
                              Number(line.unit_cost || 0)
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">
                    Catatan (opsional)
                    <textarea
                      value={notes}
                      onChange={(event) =>
                        setNotes(event.target.value)
                      }
                      maxLength={500}
                      rows={3}
                      placeholder="Catatan penerimaan barang"
                      className={`${InputClass} h-auto py-2`}
                    />
                  </label>
                  <div className="bg-primary/5 border-primary/20 flex flex-col justify-center rounded-xl border p-5">
                    <p className="text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase">
                      Total purchase
                    </p>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight">
                      {formatMoney(totalAmount)}
                    </p>
                    <p className="text-muted-foreground mt-2 text-xs">
                      Tidak termasuk pajak pada phase ini.
                    </p>
                  </div>
                </div>

                {errorMessage ? (
                  <div
                    role="alert"
                    className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm"
                  >
                    {errorMessage}
                  </div>
                ) : null}
                {successMessage ? (
                  <div
                    role="status"
                    className="border-success/30 bg-success/10 text-success rounded-lg border px-4 py-3 text-sm"
                  >
                    {successMessage}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => void submit(false)}
                  >
                    Simpan draft
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isSubmitting || totalAmount <= 0
                    }
                  >
                    {isSubmitting
                      ? 'Memproses…'
                      : 'Simpan & post'}
                  </Button>
                  <Badge variant="outline">
                    Inventory + journal seimbang
                  </Badge>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-l-primary h-fit border-l-4">
            <CardHeader>
              <CardTitle>Aturan purchase</CardTitle>
              <CardDescription>
                Finance menjaga perbedaan antara barang
                masuk dan pembayaran.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm leading-6">
              <p>
                Debit inventory dan credit Kas/Bank jika
                sudah dibayar.
              </p>
              <p>
                Debit inventory dan credit Utang Usaha jika
                belum dibayar.
              </p>
              <p className="text-muted-foreground">
                Draft belum memengaruhi stok atau jurnal.
                Posting membuat keduanya dalam satu
                transaksi database.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <PurchaseHistory
        purchases={purchases.purchases}
        postingId={postingId}
        onPost={postExisting}
      />
    </div>
  );
}

function PurchaseHistory({
  purchases,
  postingId,
  onPost,
}: {
  purchases: FinancePurchaseSummaryDTO[];
  postingId: string | null;
  onPost: (purchase: FinancePurchaseSummaryDTO) => void;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Riwayat purchase</CardTitle>
        <CardDescription>
          Draft dapat diposting setelah item, lokasi, dan
          pembayaran siap.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {purchases.length === 0 ? (
          <div className="text-muted-foreground px-6 py-10 text-center text-sm">
            Belum ada purchase Finance.
          </div>
        ) : (
          <div className="divide-y">
            {purchases.map((purchase) => (
              <div
                key={purchase.purchase_id}
                className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/finance/purchase/${purchase.purchase_id}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {purchase.supplier_name ??
                        'Purchase tanpa supplier'}
                    </Link>
                    <StatusBadge status={purchase.status} />
                    <Badge variant="outline">
                      {purchase.payment_timing === 'paid'
                        ? 'Dibayar'
                        : 'Utang'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {formatDate(purchase.transaction_date)}
                    {purchase.supplier_reference
                      ? ` · ${purchase.supplier_reference}`
                      : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
                  <span className="font-mono text-sm font-semibold">
                    {formatMoney(purchase.total_amount)}
                  </span>
                  {purchase.journal_entry_id ? (
                    <Link
                      href={`/dashboard/finance/accounting/general-journal/${purchase.journal_entry_id}`}
                      className="text-primary text-xs font-medium underline-offset-4 hover:underline"
                    >
                      Journal
                    </Link>
                  ) : null}
                  {purchase.status === 'draft' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        postingId === purchase.purchase_id
                      }
                      onClick={() => onPost(purchase)}
                    >
                      {postingId === purchase.purchase_id
                        ? 'Mem-posting…'
                        : 'Post draft'}
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({
  status,
}: {
  status: 'draft' | 'posted';
}) {
  return (
    <Badge
      variant={status === 'posted' ? 'success' : 'warning'}
    >
      {status === 'posted' ? 'Posted' : 'Draft'}
    </Badge>
  );
}

const InputClass =
  'border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-10 rounded-lg border px-3 text-sm outline-none focus-visible:ring-3';

const formatMoney = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
  }).format(new Date(value));

function getErrorMessage(payload: unknown) {
  const parsed = ErrorResponseSchema.safeParse(payload);
  return parsed.success
    ? parsed.data.error.message
    : 'Purchase Finance gagal diproses.';
}
