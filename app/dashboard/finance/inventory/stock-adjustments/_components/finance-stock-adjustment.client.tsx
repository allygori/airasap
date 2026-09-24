'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { revalidateLogic } from '@tanstack/react-form';
import { z } from 'zod';
import { useAppForm } from '@/components/form/form.hook';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FinanceStockAdjustmentForm } from './finance-stock-adjustment.form';
import {
  createFinanceStockAdjustmentFormSchema,
  type FinanceStockAdjustmentFormValues,
} from './finance-stock-adjustment.schema';
import {
  FinanceInventoryAdjustmentResponseSchema,
  type FinanceInventoryAdjustmentItemOptionDTO,
  type FinanceInventoryAdjustmentLocationOptionDTO,
} from '@/modules/finance/client';

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

export function FinanceStockAdjustmentClient({
  items,
  locations,
}: {
  items: FinanceInventoryAdjustmentItemOptionDTO[];
  locations: FinanceInventoryAdjustmentLocationOptionDTO[];
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);
  const [successMessage, setSuccessMessage] = useState<
    string | null
  >(null);
  const formSchema = useMemo(
    () =>
      createFinanceStockAdjustmentFormSchema(
        items,
        locations
      ),
    [items, locations]
  );
  const form = useAppForm({
    defaultValues: {
      item_id: items[0]?.id ?? '',
      location_id: locations[0]?.id ?? '',
      direction: 'increase',
      reason: 'stock_count',
      quantity: '1',
      unit_cost: '',
      transaction_date: new Date()
        .toISOString()
        .slice(0, 10),
      notes: '',
    } as FinanceStockAdjustmentFormValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: formSchema },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      try {
        const selectedItem = items.find(
          (item) => item.id === value.item_id
        );
        const response = await fetch(
          '/api/v1/dashboard/finance/inventory/adjustments',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              item_id: value.item_id,
              location_id: value.location_id,
              direction: value.direction,
              reason: value.reason,
              quantity: Number(value.quantity),
              ...(selectedItem?.track_value
                ? { unit_cost: Number(value.unit_cost) }
                : {}),
              transaction_date: `${value.transaction_date}T00:00:00.000Z`,
              ...(value.notes.trim()
                ? { notes: value.notes.trim() }
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
        form.setFieldValue('quantity', '1');
        form.setFieldValue('unit_cost', '');
        form.setFieldValue('notes', '');
      } catch {
        setErrorMessage(
          'Tidak dapat menghubungi server Finance.'
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

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
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/dashboard/finance/inventory/setup"
                className={buttonVariants({
                  variant: 'outline',
                })}
              >
                Siapkan inventory
              </Link>
            </div>
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
              <FinanceStockAdjustmentForm
                form={form}
                items={items}
                locations={locations}
                isSubmitting={isSubmitting}
                errorMessage={errorMessage}
                successMessage={successMessage}
              />
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
