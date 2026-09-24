'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { z } from 'zod';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const ApiResponseSchema = z.object({
  success: z.literal(true),
});

export function FinanceSaleFullReturn({
  journalEntryId,
  initialDate,
}: {
  journalEntryId: string;
  initialDate: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [effectiveDate, setEffectiveDate] =
    useState(initialDate);
  const [description, setDescription] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!description.trim()) {
      setError(
        'Jelaskan alasan retur sebelum melanjutkan.'
      );
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/v1/dashboard/finance/accounting/journal-entries/${journalEntryId}/reverse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            effective_date: effectiveDate,
            description: `Retur penuh: ${description.trim()}`,
            idempotency_key: `finance-sale-full-return:${journalEntryId}`,
          }),
        }
      );
      const payload: unknown = await response.json();
      if (!response.ok) {
        setError(getErrorMessage(payload));
        return;
      }
      if (!ApiResponseSchema.safeParse(payload).success) {
        setError('Respons server Finance tidak valid.');
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError('Tidak dapat menghubungi server Finance.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-3">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Retur belum diproses</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button variant="outline">
              Proses retur penuh
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Retur seluruh penjualan?
            </DialogTitle>
            <DialogDescription>
              Ini membalik seluruh jurnal penjualan dan HPP,
              lalu mengembalikan seluruh stok yang tercatat
              ke inventory. Hanya gunakan jika seluruh
              transaksi dibatalkan dan barang kembali layak
              dijual. Retur sebagian, barang rusak, atau
              refund tanpa barang kembali belum didukung.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="grid gap-4">
            <Field>
              <FieldLabel htmlFor="return-date">
                Tanggal koreksi
              </FieldLabel>
              <Input
                id="return-date"
                type="date"
                required
                value={effectiveDate}
                onChange={(event) =>
                  setEffectiveDate(event.target.value)
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="return-reason">
                Alasan retur
              </FieldLabel>
              <Textarea
                id="return-reason"
                required
                maxLength={450}
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Contoh: seluruh pesanan dikembalikan pembeli"
              />
            </Field>
            <DialogFooter>
              <DialogClose
                render={
                  <Button type="button" variant="outline">
                    Kembali
                  </Button>
                }
              />
              <Button
                type="submit"
                variant="destructive"
                disabled={working}
              >
                {working
                  ? 'Memproses…'
                  : 'Buat reversal penuh'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
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
  return 'Finance tidak dapat memproses retur ini.';
}
