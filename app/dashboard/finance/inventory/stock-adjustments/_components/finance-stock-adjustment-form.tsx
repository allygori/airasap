'use client';

import Link from 'next/link';
import { useState } from 'react';
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
  FinanceInventoryAdjustmentResponseSchema,
  type FinanceInventoryAdjustmentItemOptionDTO,
  type FinanceInventoryAdjustmentLocationOptionDTO,
} from '@/modules/finance';

const ActionResponseSchema = z.object({
  success: z.literal(true),
  data: FinanceInventoryAdjustmentResponseSchema,
});

const ERROR_RESPONSE_SCHEMA = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string(),
  }),
});

export function FinanceStockAdjustmentForm({
  items,
  locations,
}: {
  items: FinanceInventoryAdjustmentItemOptionDTO[];
  locations: FinanceInventoryAdjustmentLocationOptionDTO[];
}) {
  const [itemId, setItemId] = useState(items[0]?.id ?? '');
  const [locationId, setLocationId] = useState(
    locations[0]?.id ?? ''
  );
  const [direction, setDirection] = useState<
    'increase' | 'decrease'
  >('increase');
  const [reason, setReason] = useState<
    'stock_count' | 'damage' | 'loss' | 'other'
  >('stock_count');
  const [quantity, setQuantity] = useState('1');
  const [unitCost, setUnitCost] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);
  const [successMessage, setSuccessMessage] = useState<
    string | null
  >(null);
  const selectedItem = items.find(
    (item) => item.id === itemId
  );

  const submit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        '/api/v1/dashboard/finance/inventory/adjustments',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_id: itemId,
            location_id: locationId,
            direction,
            reason,
            quantity: Number(quantity),
            ...(selectedItem?.track_value
              ? { unit_cost: Number(unitCost) }
              : {}),
            transaction_date: `${transactionDate}T00:00:00.000Z`,
            ...(notes.trim()
              ? { notes: notes.trim() }
              : {}),
            idempotency_key: crypto.randomUUID(),
          }),
        }
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
          'Respons server Finance tidak valid.'
        );
        return;
      }

      const journalMessage = parsed.data.data
        .journal_entry_id
        ? ' Journal adjustment sudah dibuat.'
        : ' Movement tercatat tanpa journal karena item tidak melacak nilai.';
      setSuccessMessage(
        `Adjustment posted untuk ${parsed.data.data.quantity} unit.${journalMessage}`
      );
      setQuantity('1');
      setUnitCost('');
      setNotes('');
    } catch {
      setErrorMessage(
        'Tidak dapat menghubungi server Finance.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-3xl flex-col gap-2">
          <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
            Finance / Persediaan
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Stock adjustment
          </h1>
          <p className="text-muted-foreground leading-7">
            Catat selisih stok, kerusakan, atau kehilangan
            tanpa mengubah transaksi yang sudah posted.
          </p>
        </div>
        <Link
          href="/dashboard/finance/inventory/product-and-stock-list"
          className="text-primary text-sm font-medium underline-offset-4 hover:underline"
        >
          Lihat saldo stok →
        </Link>
      </div>

      {items.length === 0 || locations.length === 0 ? (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Data inventory belum siap</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground leading-7">
            Pastikan sudah ada item inventory aktif dan
            minimal satu lokasi aktif sebelum membuat
            adjustment.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.55fr)]">
          <Card className="max-w-3xl">
            <CardHeader className="border-b">
              <CardTitle>Adjustment baru</CardTitle>
              <CardDescription>
                Saldo negatif ditolak. Akun inventory dan
                akun lawan dipilih otomatis dari Chart of
                Accounts.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form
                onSubmit={submit}
                className="grid gap-5"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">
                    Item inventory
                    <select
                      value={itemId}
                      onChange={(event) =>
                        setItemId(event.target.value)
                      }
                      className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-10 rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"
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
                      value={locationId}
                      onChange={(event) =>
                        setLocationId(event.target.value)
                      }
                      className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-10 rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"
                    >
                      {locations.map((location) => (
                        <option
                          key={location.id}
                          value={location.id}
                        >
                          {location.code} — {location.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">
                    Aksi stok
                    <select
                      value={direction}
                      onChange={(event) =>
                        setDirection(
                          event.target.value as
                            | 'increase'
                            | 'decrease'
                        )
                      }
                      className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-10 rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"
                    >
                      <option value="increase">
                        Tambah stok
                      </option>
                      <option value="decrease">
                        Kurangi stok
                      </option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Alasan
                    <select
                      value={reason}
                      onChange={(event) =>
                        setReason(
                          event.target.value as
                            | 'stock_count'
                            | 'damage'
                            | 'loss'
                            | 'other'
                        )
                      }
                      className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-10 rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"
                    >
                      <option value="stock_count">
                        Hasil stock count
                      </option>
                      <option value="damage">
                        Kerusakan
                      </option>
                      <option value="loss">
                        Kehilangan
                      </option>
                      <option value="other">Lainnya</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">
                    Quantity ({selectedItem?.unit ?? 'unit'}
                    )
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={quantity}
                      onChange={(event) =>
                        setQuantity(event.target.value)
                      }
                      className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-10 rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"
                      required
                    />
                  </label>
                  {selectedItem?.track_value ? (
                    <label className="grid gap-2 text-sm font-medium">
                      Unit cost (IDR)
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={unitCost}
                        onChange={(event) =>
                          setUnitCost(event.target.value)
                        }
                        className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-10 rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"
                        placeholder="Contoh: 25000"
                        required
                      />
                    </label>
                  ) : (
                    <div className="border-info/30 bg-info/5 rounded-lg border p-3 text-sm">
                      Item ini hanya melacak quantity.
                      Adjustment tidak membuat journal
                      nilai.
                    </div>
                  )}
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
                      className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-10 rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Catatan (opsional)
                    <input
                      value={notes}
                      onChange={(event) =>
                        setNotes(event.target.value)
                      }
                      maxLength={500}
                      placeholder="Contoh: Hasil opname 22 September"
                      className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-10 rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"
                    />
                  </label>
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
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? 'Mem-posting...'
                      : 'Post adjustment'}
                  </Button>
                  <Badge variant="outline">
                    Posted immutable
                  </Badge>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Aturan sederhana</CardTitle>
              <CardDescription>
                Finance menjaga jurnal tetap seimbang tanpa
                membebani user.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm leading-6">
              <p>
                Tambah stok: debit inventory dan credit akun
                selisih stok.
              </p>
              <p>
                Kurangi stok: debit beban selisih stok dan
                credit inventory.
              </p>
              <p className="text-muted-foreground">
                Jika akun default belum tersedia, posting
                akan ditolak agar tidak membuat jurnal yang
                salah.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function getErrorMessage(payload: unknown) {
  const parsed = ERROR_RESPONSE_SCHEMA.safeParse(payload);
  return parsed.success
    ? parsed.data.error.message
    : 'Adjustment inventory gagal diposting.';
}
