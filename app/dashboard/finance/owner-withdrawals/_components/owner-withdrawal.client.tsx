'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { revalidateLogic } from '@tanstack/react-form';
import { z } from 'zod';
import { useAppForm } from '@/components/form/form.hook';
import { buildFinanceFilterHref } from '@/app/dashboard/finance/_lib/finance-filter-url';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FinanceOwnerWithdrawalInputSchema,
  FinanceOwnerWithdrawalResponseSchema,
  type FinanceOwnerWithdrawalMonthlyTotalDTO,
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
import { OwnerWithdrawalFilterForm } from './owner-withdrawal-filter.form';
import { OwnerWithdrawalReversalDialog } from './owner-withdrawal-reversal.dialog';

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
  ownerFilterAccounts: FinanceOwnerAccountOption[];
  paymentAccounts: FinanceWithdrawalPaymentAccountOption[];
  withdrawals: FinanceOwnerWithdrawalListResponseDTO;
  filters: {
    from_date: string;
    to_date: string;
    owner_account_id: string;
  };
  businessDate: string;
};

export function FinanceOwnerWithdrawalClient({
  ownerAccounts,
  ownerFilterAccounts,
  paymentAccounts,
  withdrawals,
  filters,
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
  const [reversingWithdrawal, setReversingWithdrawal] =
    useState<FinanceOwnerWithdrawalSummaryDTO | null>(null);

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

      <Card>
        <CardHeader className="border-b">
          <CardTitle>
            Riwayat &amp; ringkasan penarikan
          </CardTitle>
          <CardDescription>
            Pilih periode hingga lima tahun dan akun prive
            untuk meninjau aktivitas.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <OwnerWithdrawalFilterForm
            initialValues={filters}
            ownerAccounts={ownerFilterAccounts}
          />
        </CardContent>
      </Card>

      <MonthlyWithdrawalSummary
        totals={withdrawals.monthly_totals}
        fromDate={withdrawals.summary_range.from_date}
        toDate={withdrawals.summary_range.to_date}
      />

      <WithdrawalHistory
        withdrawals={withdrawals.withdrawals}
        pagination={withdrawals.pagination}
        filters={filters}
        postingId={postingId}
        onPost={postExisting}
        onReverse={setReversingWithdrawal}
      />

      {reversingWithdrawal ? (
        <OwnerWithdrawalReversalDialog
          withdrawal={reversingWithdrawal}
          businessDate={businessDate}
          onOpenChange={(open) => {
            if (!open) setReversingWithdrawal(null);
          }}
          onSuccess={() => {
            setReversingWithdrawal(null);
            setSuccessMessage(
              'Jurnal pembalik berhasil dibuat dan ditautkan ke penarikan.'
            );
          }}
        />
      ) : null}
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

function MonthlyWithdrawalSummary({
  totals,
  fromDate,
  toDate,
}: {
  totals: FinanceOwnerWithdrawalMonthlyTotalDTO[];
  fromDate: string;
  toDate: string;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Mutasi akun prive per bulan</CardTitle>
        <CardDescription>
          Jurnal posted untuk {formatDateOnly(fromDate)}–
          {formatDateOnly(toDate)}. Debit mencatat
          penarikan, kredit dapat mencakup jurnal pembalik
          atau koreksi; dampak bersih bukan ukuran laba yang
          boleh dibagikan.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {totals.length === 0 ? (
          <Empty className="min-h-36 border-0">
            <EmptyHeader>
              <EmptyTitle>
                Belum ada mutasi posted
              </EmptyTitle>
              <EmptyDescription>
                Tidak ada baris jurnal akun prive pada
                rentang yang dipilih.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periode</TableHead>
                <TableHead>Akun prive</TableHead>
                <TableHead className="text-right">
                  Debit
                </TableHead>
                <TableHead className="text-right">
                  Kredit pembalik
                </TableHead>
                <TableHead className="text-right">
                  Dampak bersih
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {totals.map((total) => (
                <TableRow
                  key={`${total.period}-${total.owner_account.id}`}
                >
                  <TableCell>
                    {formatPeriod(total.period)}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {total.owner_account.code} —{' '}
                      {total.owner_account.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatMoney(total.debit_total)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatMoney(total.credit_total)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {formatMoney(total.net_debit)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function WithdrawalHistory({
  withdrawals,
  pagination,
  filters,
  postingId,
  onPost,
  onReverse,
}: {
  withdrawals: FinanceOwnerWithdrawalSummaryDTO[];
  pagination: FinanceOwnerWithdrawalListResponseDTO['pagination'];
  filters: {
    from_date: string;
    to_date: string;
    owner_account_id: string;
  };
  postingId: string | null;
  onPost: (
    withdrawal: FinanceOwnerWithdrawalSummaryDTO
  ) => void;
  onReverse: (
    withdrawal: FinanceOwnerWithdrawalSummaryDTO
  ) => void;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Riwayat penarikan</CardTitle>
        <CardDescription>
          Jurnal yang posted tetap immutable. Untuk koreksi,
          balikkan transaksi lalu catat transaksi pengganti
          bila diperlukan.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {withdrawals.length === 0 ? (
          <Empty className="min-h-48 border-0">
            <EmptyHeader>
              <EmptyTitle>
                Tidak ada transaksi pada periode ini
              </EmptyTitle>
              <EmptyDescription>
                Ubah rentang tanggal atau akun prive untuk
                melihat riwayat lain.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Penarikan / akun</TableHead>
                <TableHead>Dari Kas/Bank</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Jurnal</TableHead>
                <TableHead className="text-right">
                  Nominal
                </TableHead>
                <TableHead className="text-right">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.map((withdrawal) => (
                <TableRow key={withdrawal.withdrawal_id}>
                  <TableCell>
                    {formatDate(
                      withdrawal.transaction_date
                    )}
                  </TableCell>
                  <TableCell className="min-w-56 whitespace-normal">
                    <p className="font-medium">
                      {withdrawal.description}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {withdrawal.owner_account.code} —{' '}
                      {withdrawal.owner_account.name}
                      {withdrawal.reference
                        ? ` · ${withdrawal.reference}`
                        : ''}
                    </p>
                  </TableCell>
                  <TableCell>
                    {withdrawal.payment_account.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        withdrawal.status === 'posted'
                          ? 'default'
                          : withdrawal.status === 'reversed'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {withdrawal.status === 'posted'
                        ? 'Posted'
                        : withdrawal.status === 'reversed'
                          ? 'Dibalik'
                          : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-32 flex-col items-start gap-1">
                      {withdrawal.journal_entry_id ? (
                        <Link
                          href={`/dashboard/finance/accounting/general-journal/${withdrawal.journal_entry_id}`}
                          className="text-primary text-sm font-medium underline-offset-4 hover:underline"
                        >
                          Jurnal asli
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Belum diposting
                        </span>
                      )}
                      {withdrawal.reversal_journal_entry_id ? (
                        <Link
                          href={`/dashboard/finance/accounting/general-journal/${withdrawal.reversal_journal_entry_id}`}
                          className="text-primary text-sm font-medium underline-offset-4 hover:underline"
                        >
                          Jurnal pembalik
                        </Link>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {formatMoney(withdrawal.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
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
                      {withdrawal.status === 'posted' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            onReverse(withdrawal)
                          }
                        >
                          Balikkan
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            {pagination.total} transaksi · Halaman{' '}
            {pagination.page} dari{' '}
            {Math.max(pagination.total_pages, 1)}
          </p>
          <div className="flex gap-2">
            {pagination.page > 1 ? (
              <Link
                href={buildOwnerWithdrawalPageHref(
                  filters,
                  pagination.page - 1
                )}
                className={buttonVariants({
                  variant: 'outline',
                  size: 'sm',
                })}
              >
                Sebelumnya
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Sebelumnya
              </Button>
            )}
            {pagination.page < pagination.total_pages ? (
              <Link
                href={buildOwnerWithdrawalPageHref(
                  filters,
                  pagination.page + 1
                )}
                className={buttonVariants({
                  variant: 'outline',
                  size: 'sm',
                })}
              >
                Berikutnya
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Berikutnya
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function buildOwnerWithdrawalPageHref(
  filters: {
    from_date: string;
    to_date: string;
    owner_account_id: string;
  },
  page: number
) {
  return buildFinanceFilterHref(
    '/dashboard/finance/owner-withdrawals',
    {
      ...filters,
      page: String(page),
      limit: '25',
    }
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

function formatDateOnly(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00.000Z`));
}

function formatPeriod(period: string) {
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${period}-01T00:00:00.000Z`));
}
