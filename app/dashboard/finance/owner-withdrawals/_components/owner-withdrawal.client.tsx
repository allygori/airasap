'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { revalidateLogic } from '@tanstack/react-form';
import { z } from 'zod';
import { useAppForm } from '@/components/form/form.hook';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  FinanceOwnerWithdrawalInputSchema,
  FinanceOwnerWithdrawalResponseSchema,
  type FinanceOwnerWithdrawalListResponseDTO,
  type FinanceOwnerWithdrawalSummaryDTO,
} from '@/modules/finance/client';
import {
  createOwnerWithdrawalFormDefaults,
  OwnerWithdrawalForm,
  type FinanceOwnerAccountOption,
  type FinanceWithdrawalPaymentAccountOption,
  type OwnerWithdrawalFormIntent,
} from './owner-withdrawal.form';
import {
  FinanceOwnerWithdrawalFormSchema,
  type FinanceOwnerWithdrawalFormValues,
} from './owner-withdrawal.form.schema';

const ActionResponseSchema = z.object({
  success: z.literal(true),
  data: FinanceOwnerWithdrawalResponseSchema,
});

const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({ message: z.string() }),
});

type FinanceOwnerWithdrawalClientProps = {
  ownerAccounts: FinanceOwnerAccountOption[];
  paymentAccounts: FinanceWithdrawalPaymentAccountOption[];
  withdrawals: FinanceOwnerWithdrawalListResponseDTO;
  businessDate: string;
};

export function FinanceOwnerWithdrawalClient({
  ownerAccounts,
  paymentAccounts,
  withdrawals,
  businessDate,
}: FinanceOwnerWithdrawalClientProps) {
  const router = useRouter();
  const submitIntentRef =
    useRef<OwnerWithdrawalFormIntent>('post');
  const idempotencyKeyRef = useRef<{
    requestFingerprint: string;
    key: string;
  } | null>(null);
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

  const form = useAppForm({
    defaultValues: createOwnerWithdrawalFormDefaults({
      businessDate,
    }),
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: FinanceOwnerWithdrawalFormSchema,
    },
    onSubmit: async ({ value }) =>
      submit(value, submitIntentRef.current),
  });

  const submit = async (
    values: FinanceOwnerWithdrawalFormValues,
    intent: OwnerWithdrawalFormIntent
  ) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const requestFields = {
        owner_account_id: values.owner_account_id,
        payment_account_id: values.payment_account_id,
        amount: Number(values.amount),
        transaction_date: `${values.transaction_date}T00:00:00.000Z`,
        ...(values.description.trim()
          ? { description: values.description.trim() }
          : {}),
        ...(values.reference.trim()
          ? { reference: values.reference.trim() }
          : {}),
      };
      const requestFingerprint =
        JSON.stringify(requestFields);
      const requestIdempotencyKey =
        idempotencyKeyRef.current?.requestFingerprint ===
        requestFingerprint
          ? idempotencyKeyRef.current.key
          : crypto.randomUUID();
      idempotencyKeyRef.current = {
        requestFingerprint,
        key: requestIdempotencyKey,
      };
      const payload =
        FinanceOwnerWithdrawalInputSchema.parse({
          ...requestFields,
          idempotency_key: requestIdempotencyKey,
        });

      const createResponse = await fetch(
        '/api/v1/dashboard/finance/owner-withdrawals',
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
      idempotencyKeyRef.current = null;

      if (intent === 'post') {
        const postResult = await postWithdrawal(
          created.data.data.withdrawal_id
        );
        if (!postResult.ok) {
          setErrorMessage(
            `Draft tersimpan, tetapi posting gagal: ${postResult.message}. Anda dapat mencoba lagi dari riwayat.`
          );
          form.reset();
          router.refresh();
          return;
        }
        setSuccessMessage(
          'Penarikan pemilik berhasil diposting.'
        );
      } else {
        setSuccessMessage(
          'Draft penarikan pemilik berhasil disimpan.'
        );
      }

      form.reset();
      router.refresh();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof z.ZodError
          ? 'Data penarikan tidak valid. Periksa kembali isian.'
          : 'Tidak dapat menghubungi server Finance.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestSubmit = (
    intent: OwnerWithdrawalFormIntent
  ) => {
    submitIntentRef.current = intent;
    void form.handleSubmit();
  };

  const postExisting = async (
    withdrawal: FinanceOwnerWithdrawalSummaryDTO
  ) => {
    setPostingId(withdrawal.withdrawal_id);
    setErrorMessage(null);
    setSuccessMessage(null);
    const result = await postWithdrawal(
      withdrawal.withdrawal_id
    );
    if (result.ok) {
      setSuccessMessage(
        'Draft penarikan pemilik berhasil diposting.'
      );
      router.refresh();
    } else {
      setErrorMessage(result.message);
    }
    setPostingId(null);
  };

  const hasAccounts =
    ownerAccounts.length > 0 && paymentAccounts.length > 0;

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
            Finance / Transaksi
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Penarikan pemilik
          </h1>
          <p className="text-muted-foreground leading-7">
            Catat uang usaha yang diambil pemilik. Penarikan
            mengurangi ekuitas, bukan biaya usaha atau laba.
          </p>
        </div>
        <Link
          href="/dashboard/finance/accounting/general-journal"
          className={buttonVariants({ variant: 'outline' })}
        >
          Buka jurnal umum
        </Link>
      </div>

      {errorMessage ? (
        <Alert variant="destructive" role="alert">
          <AlertTitle>Penarikan belum selesai</AlertTitle>
          <AlertDescription>
            {errorMessage}
          </AlertDescription>
        </Alert>
      ) : null}
      {successMessage ? (
        <Alert role="status">
          <AlertDescription>
            {successMessage}
          </AlertDescription>
        </Alert>
      ) : null}

      {!hasAccounts ? (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Akun transaksi belum siap</CardTitle>
            <CardDescription>
              Pilih akun prive pemilik dan akun Kas/Bank
              aktif sebelum mencatat penarikan.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {ownerAccounts.length === 0 ? (
              <Link
                href="/dashboard/finance/accounting/chart-of-accounts"
                className={buttonVariants({
                  variant: 'outline',
                })}
              >
                Periksa akun prive
              </Link>
            ) : null}
            {paymentAccounts.length === 0 ? (
              <Link
                href="/dashboard/finance/cash-and-bank"
                className={buttonVariants({
                  variant: 'outline',
                })}
              >
                Periksa Kas &amp; Bank
              </Link>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-5xl min-w-0">
          <CardHeader className="border-b">
            <CardTitle>Catat pengambilan dana</CardTitle>
            <CardDescription>
              Simpan sebagai draft untuk diperiksa, atau
              langsung post agar jurnal dan saldo Kas/Bank
              diperbarui. Tanggal awal mengikuti kalender
              Finance ({businessDate}).
            </CardDescription>
          </CardHeader>
          <CardContent className="min-w-0 pt-6">
            <OwnerWithdrawalForm
              form={form}
              ownerAccounts={ownerAccounts}
              paymentAccounts={paymentAccounts}
              isSubmitting={isSubmitting}
              onSubmitIntent={requestSubmit}
            />
          </CardContent>
        </Card>
      )}

      <WithdrawalHistory
        withdrawals={withdrawals.withdrawals}
        postingId={postingId}
        onPost={postExisting}
      />
    </div>
  );
}

async function postWithdrawal(withdrawalId: string) {
  try {
    const response = await fetch(
      `/api/v1/dashboard/finance/owner-withdrawals/${withdrawalId}/post`,
      { method: 'POST' }
    );
    const payload: unknown = await response.json();
    if (!response.ok) {
      return {
        ok: false as const,
        message: getErrorMessage(payload),
      };
    }
    const parsed = ActionResponseSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        ok: false as const,
        message: 'Respons server Finance tidak valid.',
      };
    }
    return { ok: true as const };
  } catch {
    return {
      ok: false as const,
      message: 'Tidak dapat menghubungi server Finance.',
    };
  }
}

function WithdrawalHistory({
  withdrawals,
  postingId,
  onPost,
}: {
  withdrawals: FinanceOwnerWithdrawalSummaryDTO[];
  postingId: string | null;
  onPost: (
    withdrawal: FinanceOwnerWithdrawalSummaryDTO
  ) => void;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Riwayat penarikan</CardTitle>
        <CardDescription>
          Menampilkan hingga 25 transaksi terbaru. Jurnal
          yang sudah posted tidak dapat diedit; draft dapat
          diposting setelah diperiksa.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {withdrawals.length === 0 ? (
          <Empty className="min-h-48 border-0">
            <EmptyHeader>
              <EmptyTitle>
                Belum ada penarikan pemilik
              </EmptyTitle>
              <EmptyDescription>
                Penarikan yang disimpan akan muncul di sini
                beserta status dan jurnalnya.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="divide-y">
            {withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.withdrawal_id}
                className="flex flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {withdrawal.description}
                    </span>
                    <Badge
                      variant={
                        withdrawal.status === 'posted'
                          ? 'default'
                          : 'outline'
                      }
                    >
                      {withdrawal.status === 'posted'
                        ? 'Posted'
                        : 'Draft'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {formatDate(
                      withdrawal.transaction_date
                    )}
                    {' · '}
                    {withdrawal.owner_account.name}
                    {' · dari '}
                    {withdrawal.payment_account.name}
                    {withdrawal.reference
                      ? ` · ${withdrawal.reference}`
                      : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                  <span className="font-mono text-sm font-semibold">
                    {formatMoney(withdrawal.amount)}
                  </span>
                  {withdrawal.journal_entry_id ? (
                    <Link
                      href={`/dashboard/finance/accounting/general-journal/${withdrawal.journal_entry_id}`}
                      className="text-primary text-sm font-medium underline-offset-4 hover:underline"
                    >
                      Lihat jurnal
                    </Link>
                  ) : null}
                  {withdrawal.status === 'draft' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        postingId ===
                        withdrawal.withdrawal_id
                      }
                      onClick={() => onPost(withdrawal)}
                    >
                      {postingId ===
                      withdrawal.withdrawal_id
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

function getErrorMessage(payload: unknown) {
  const parsed = ErrorResponseSchema.safeParse(payload);
  return parsed.success
    ? parsed.data.error.message
    : 'Terjadi kesalahan saat memproses penarikan.';
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(date));
}
