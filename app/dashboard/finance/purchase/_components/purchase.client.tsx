'use client';

import { formatMediumDate as formatDate } from '@/lib/date';
import { formatIDR as formatMoney } from '@/lib/number/money';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { revalidateLogic } from '@tanstack/react-form';
import { z } from 'zod';
import { useAppForm } from '@/components/form/form.hook';
import { Badge } from '@/components/ui/badge';
import {
  Button,
  buttonVariants,
} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FinancePurchaseInputSchema,
  FinancePurchaseResponseSchema,
  type FinancePurchaseListResponseDTO,
  type FinancePurchaseSummaryDTO,
} from '@/modules/finance/client';
import {
  createPurchaseFormDefaults,
  FinancePurchaseFormSchema,
  PurchaseForm,
  type FinancePurchaseFormValues,
  type PurchaseFormIntent,
  type PurchaseAccountOption,
  type PurchaseItemOption,
  type PurchaseLocationOption,
} from './purchase.form';

const ActionResponseSchema = z.object({
  success: z.literal(true),
  data: FinancePurchaseResponseSchema,
});

const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({ message: z.string() }),
});

type FinancePurchaseClientProps = {
  items: PurchaseItemOption[];
  locations: PurchaseLocationOption[];
  paymentAccounts: PurchaseAccountOption[];
  purchases: FinancePurchaseListResponseDTO;
};

export function FinancePurchaseClient({
  items,
  locations,
  paymentAccounts,
  purchases,
}: FinancePurchaseClientProps) {
  const router = useRouter();
  const submitIntentRef =
    useRef<PurchaseFormIntent>('post');
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

  const submit = async (
    values: FinancePurchaseFormValues,
    intent: PurchaseFormIntent
  ) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = FinancePurchaseInputSchema.parse({
        ...(values.supplier_name.trim()
          ? { supplier_name: values.supplier_name.trim() }
          : {}),
        ...(values.supplier_reference.trim()
          ? {
              supplier_reference:
                values.supplier_reference.trim(),
            }
          : {}),
        transaction_date: `${values.transaction_date}T00:00:00.000Z`,
        payment_timing: values.payment_timing,
        ...(values.payment_timing === 'paid'
          ? {
              payment_account_id: values.payment_account_id,
            }
          : {}),
        lines: values.lines.map((line) => ({
          item_id: line.item_id,
          location_id: line.location_id,
          quantity: Number(line.quantity),
          unit_cost: Number(line.unit_cost),
        })),
        ...(values.notes.trim()
          ? { notes: values.notes.trim() }
          : {}),
        idempotency_key: crypto.randomUUID(),
      });

      const createResponse = await fetch(
        '/api/v1/dashboard/finance/purchases',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
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

      if (intent === 'post') {
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

      form.reset();
      router.refresh();
    } catch {
      setErrorMessage('Purchase Finance gagal diproses.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const form = useAppForm({
    defaultValues: createPurchaseFormDefaults({
      items,
      locations,
      paymentAccounts,
    }),
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: FinancePurchaseFormSchema,
    },
    onSubmit: async ({ value }) => {
      await submit(value, submitIntentRef.current);
    },
  });

  const requestSubmit = (intent: PurchaseFormIntent) => {
    submitIntentRef.current = intent;
    void form.handleSubmit();
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
            <div className="mt-4">
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
          <Card className="max-w-4xl min-w-0">
            <CardHeader className="border-b">
              <CardTitle>Purchase baru</CardTitle>
              <CardDescription>
                Simpan sebagai draft untuk dilengkapi nanti,
                atau simpan &amp; post ketika data sudah
                benar.
              </CardDescription>
            </CardHeader>
            <CardContent className="min-w-0 pt-6">
              <PurchaseForm
                form={form}
                items={items}
                locations={locations}
                paymentAccounts={paymentAccounts}
                isSubmitting={isSubmitting}
                errorMessage={errorMessage}
                successMessage={successMessage}
                onSubmitIntent={requestSubmit}
              />
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

function getErrorMessage(payload: unknown) {
  const parsed = ErrorResponseSchema.safeParse(payload);
  return parsed.success
    ? parsed.data.error.message
    : 'Purchase Finance gagal diproses.';
}
