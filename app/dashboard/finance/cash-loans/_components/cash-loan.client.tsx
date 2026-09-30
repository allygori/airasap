'use client';

import { formatUtcMediumDate as formatDate } from '@/lib/date';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FinanceCashLoanBalanceSchema,
  FinanceCashLoanInputSchema,
  FinanceCashLoanResponseSchema,
} from '@/modules/finance/client';
import type {
  FinanceCashLoanEventType,
  FinanceCashLoanLenderType,
  FinanceCashLoanListResponseDTO,
  FinanceCashLoanSummaryDTO,
} from '@/modules/finance/client';
import {
  CashLoanForm,
  createCashLoanFormDefaults,
} from './cash-loan.form';
import {
  CashLoanFormSchema,
  type CashLoanFormValues,
} from './cash-loan.form.schema';
import { CashLoanReversalDialog } from './cash-loan-reversal.dialog';

const ActionResponseSchema = z.object({
  success: z.literal(true),
  data: FinanceCashLoanResponseSchema,
});
const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({ message: z.string() }),
});

type AccountOption = {
  id: string;
  code: string;
  name: string;
  subtype?: string | null;
};
type LenderBalance = ReturnType<
  typeof FinanceCashLoanBalanceSchema.parse
>;

export function FinanceCashLoanClient({
  ownerAccounts,
  paymentAccounts,
  loans,
  businessDate,
}: {
  ownerAccounts: AccountOption[];
  paymentAccounts: AccountOption[];
  loans: FinanceCashLoanListResponseDTO;
  businessDate: string;
}) {
  const router = useRouter();
  const [eventType, setEventType] =
    useState<FinanceCashLoanEventType>('received');
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
  const [reversingLoan, setReversingLoan] =
    useState<FinanceCashLoanSummaryDTO | null>(null);
  const idempotencyKeyRef = useRef<{
    requestFingerprint: string;
    key: string;
  } | null>(null);

  const form = useAppForm({
    defaultValues: createCashLoanFormDefaults({
      businessDate,
    }),
    validationLogic: revalidateLogic(),
    validators: { onDynamic: CashLoanFormSchema },
    onSubmit: async ({ value }) => submit(value),
  });
  const changeEventType = (
    nextEventType: FinanceCashLoanEventType
  ) => {
    if (nextEventType === eventType) return;
    setEventType(nextEventType);
    form.setFieldValue('event_type', nextEventType);
    form.setFieldValue('lender_name', '');
    form.setFieldValue('owner_account_id', '');
    form.setFieldValue('lender_key', '');
    form.setFieldValue('payment_account_id', '');
    setErrorMessage(null);
  };

  const submit = async (values: CashLoanFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const selectedBalance =
      values.event_type === 'repayment'
        ? loans.balances.find(
            (balance) =>
              balance.lender.key === values.lender_key
          )
        : undefined;
    if (
      selectedBalance &&
      Number(values.amount) >
        selectedBalance.outstanding_amount
    ) {
      setErrorMessage(
        `Nominal pembayaran melebihi sisa pokok pinjaman (${formatMoney(selectedBalance.outstanding_amount)}).`
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const requestFields = {
        event_type: values.event_type,
        ...(values.event_type === 'received'
          ? values.lender_type === 'owner'
            ? {
                lender_type: values.lender_type,
                owner_account_id: values.owner_account_id,
              }
            : {
                lender_type: values.lender_type,
                lender_name: values.lender_name.trim(),
              }
          : { lender_key: values.lender_key }),
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
      const idempotencyKey =
        idempotencyKeyRef.current?.requestFingerprint ===
        requestFingerprint
          ? idempotencyKeyRef.current.key
          : crypto.randomUUID();
      idempotencyKeyRef.current = {
        requestFingerprint,
        key: idempotencyKey,
      };
      const payload = FinanceCashLoanInputSchema.parse({
        ...requestFields,
        idempotency_key: idempotencyKey,
      });
      const response = await fetch(
        '/api/v1/dashboard/finance/cash-loans',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const body: unknown = await response.json();
      if (!response.ok) {
        setErrorMessage(readErrorMessage(body));
        return;
      }
      const created = ActionResponseSchema.safeParse(body);
      if (!created.success) {
        setErrorMessage(
          'Respons server Finance tidak valid.'
        );
        return;
      }
      idempotencyKeyRef.current = null;

      if (created.data.data.status === 'draft') {
        const posted = await postLoan(
          created.data.data.loan_id
        );
        if (!posted.ok) {
          setErrorMessage(
            `Draft tersimpan, tetapi jurnal belum berhasil diposting: ${posted.message}. Anda dapat mencoba lagi dari riwayat.`
          );
          form.reset();
          router.refresh();
          return;
        }
      } else if (created.data.data.status === 'reversed') {
        setErrorMessage(
          'Transaksi dengan permintaan yang sama sebelumnya sudah dibalik. Gunakan transaksi baru.'
        );
        return;
      }

      setSuccessMessage(
        values.event_type === 'received'
          ? 'Pinjaman tunai berhasil dicatat dan dijurnal.'
          : 'Pembayaran pokok pinjaman berhasil dicatat dan dijurnal.'
      );
      form.reset();
      setEventType('received');
      router.refresh();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof z.ZodError
          ? 'Data transaksi pinjaman tidak valid. Periksa kembali isian.'
          : 'Tidak dapat menghubungi server Finance.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const postLoan = async (loanId: string) => {
    try {
      const response = await fetch(
        `/api/v1/dashboard/finance/cash-loans/${loanId}/post`,
        { method: 'POST' }
      );
      const body: unknown = await response.json();
      if (!response.ok) {
        return {
          ok: false as const,
          message: readErrorMessage(body),
        };
      }
      return ActionResponseSchema.safeParse(body).success
        ? { ok: true as const }
        : {
            ok: false as const,
            message: 'Respons server Finance tidak valid.',
          };
    } catch {
      return {
        ok: false as const,
        message: 'Tidak dapat menghubungi server Finance.',
      };
    }
  };

  const postExisting = async (loanId: string) => {
    setPostingId(loanId);
    setErrorMessage(null);
    setSuccessMessage(null);
    const result = await postLoan(loanId);
    if (result.ok) {
      setSuccessMessage(
        'Transaksi pinjaman berhasil diposting.'
      );
      router.refresh();
    } else {
      setErrorMessage(result.message);
    }
    setPostingId(null);
  };

  const hasOutstanding = loans.balances.some(
    (balance) => balance.outstanding_amount > 0
  );
  const hasPaymentAccount =
    eventType === 'received'
      ? paymentAccounts.some(
          (account) => account.subtype === 'bank'
        )
      : paymentAccounts.length > 0;

  return (
    <main className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
            Finance / Transaksi
          </p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Pinjaman Tunai
          </h1>
          <p className="text-muted-foreground leading-7">
            Catat dana pinjaman dari pemilik, bank, atau
            pemberi pinjaman lain ketika masuk ke rekening
            usaha, lalu pantau pembayaran pokoknya.
          </p>
        </div>
        <Link
          href="/dashboard/finance/accounting/general-journal"
          className={buttonVariants({ variant: 'outline' })}
        >
          Buka jurnal umum
        </Link>
      </header>

      {errorMessage ? (
        <Alert variant="destructive" role="alert">
          <AlertTitle>Transaksi belum selesai</AlertTitle>
          <AlertDescription>
            {errorMessage}
          </AlertDescription>
        </Alert>
      ) : null}
      {successMessage ? (
        <Alert role="status">
          <AlertTitle>Transaksi berhasil</AlertTitle>
          <AlertDescription>
            {successMessage}
          </AlertDescription>
        </Alert>
      ) : null}

      <section
        aria-label="Sisa pinjaman per pemberi pinjaman"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {loans.balances.map((balance: LenderBalance) => (
          <Card key={balance.lender.key} className="gap-3">
            <CardHeader className="pb-0">
              <CardDescription>
                {lenderTypeLabel(balance.lender.type)} ·{' '}
                {balance.lender.name}
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {formatMoney(balance.outstanding_amount)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              Sisa pokok · diterima{' '}
              {formatMoney(balance.received_total)} ·
              dibayar {formatMoney(balance.repayment_total)}
            </CardContent>
          </Card>
        ))}
        {loans.balances.length === 0 ? (
          <Card className="sm:col-span-2 xl:col-span-3">
            <CardContent className="text-muted-foreground py-5 text-sm">
              Belum ada pinjaman yang diposting. Catat
              pinjaman setelah dana benar-benar masuk ke
              rekening usaha.
            </CardContent>
          </Card>
        ) : null}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>
            Catat pinjaman atau pembayaran pokok
          </CardTitle>
          <CardDescription>
            Pinjaman dicatat sebagai utang, bukan modal atau
            pendapatan. Tahap ini mencatat pokok saja; bunga
            belum dihitung.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form.Subscribe
            selector={(state) => state.values.lender_type}
          >
            {(lenderType) => (
              <CashLoanForm
                form={form}
                ownerAccounts={ownerAccounts}
                paymentAccounts={paymentAccounts}
                balances={loans.balances}
                eventType={eventType}
                lenderType={lenderType}
                isSubmitting={isSubmitting}
                onEventTypeChange={changeEventType}
                onSubmit={() => void form.handleSubmit()}
              />
            )}
          </form.Subscribe>
        </CardContent>
      </Card>

      {!hasPaymentAccount ? (
        <Alert>
          <AlertTitle>
            {eventType === 'received'
              ? 'Rekening Bank belum tersedia'
              : 'Akun Kas/Bank belum tersedia'}
          </AlertTitle>
          <AlertDescription>
            {eventType === 'received'
              ? 'Tambahkan rekening Bank usaha di Kas & Bank sebelum mencatat penerimaan pinjaman.'
              : 'Tambahkan akun Kas atau Bank aktif sebelum mencatat pembayaran pinjaman.'}
          </AlertDescription>
        </Alert>
      ) : null}
      {!hasOutstanding && eventType === 'repayment' ? (
        <Alert>
          <AlertTitle>Belum ada saldo pinjaman</AlertTitle>
          <AlertDescription>
            Catat pinjaman yang diterima terlebih dahulu.
            Pembayaran pokok dibatasi sebesar saldo utang
            yang tercatat.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Riwayat transaksi</CardTitle>
          <CardDescription>
            Menampilkan {loans.loans.length} transaksi pada
            halaman ini. Jurnal posted tidak diedit; koreksi
            dibuat melalui reversal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loans.loans.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Transaksi</TableHead>
                    <TableHead>Pemberi pinjaman</TableHead>
                    <TableHead>Rekening</TableHead>
                    <TableHead>Akun utang</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">
                      Nominal
                    </TableHead>
                    <TableHead className="text-right">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.loans.map((loan) => (
                    <TableRow key={loan.loan_id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(loan.transaction_date)}
                      </TableCell>
                      <TableCell className="min-w-52">
                        <p className="font-medium">
                          {loan.event_type === 'received'
                            ? 'Pinjaman diterima'
                            : 'Pembayaran pokok'}
                        </p>
                        <p className="text-muted-foreground max-w-72 truncate text-xs">
                          {loan.description}
                        </p>
                      </TableCell>
                      <TableCell className="min-w-40">
                        <p>{loan.lender.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {lenderTypeLabel(
                            loan.lender.type
                          )}
                        </p>
                      </TableCell>
                      <TableCell className="min-w-40">
                        {loan.payment_account.name}
                      </TableCell>
                      <TableCell className="min-w-40">
                        {loan.liability_account.code} ·{' '}
                        {loan.liability_account.name}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={loan.status} />
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatMoney(loan.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {loan.status === 'draft' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={
                                postingId === loan.loan_id
                              }
                              onClick={() =>
                                void postExisting(
                                  loan.loan_id
                                )
                              }
                            >
                              {postingId === loan.loan_id
                                ? 'Posting…'
                                : 'Coba posting'}
                            </Button>
                          ) : null}
                          {loan.status === 'posted' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setReversingLoan(loan)
                              }
                            >
                              Balikkan
                            </Button>
                          ) : null}
                          {loan.journal_entry_id ? (
                            <Link
                              className={buttonVariants({
                                size: 'sm',
                                variant: 'ghost',
                              })}
                              href={`/dashboard/finance/accounting/general-journal?search=${encodeURIComponent(loan.loan_id)}`}
                            >
                              Jurnal
                            </Link>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>
                  Belum ada transaksi pinjaman
                </EmptyTitle>
                <EmptyDescription>
                  Catat dana yang benar-benar masuk dari
                  pemberi pinjaman atau pembayaran kembali
                  pokok pinjamannya.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          {loans.pagination.total_pages > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-muted-foreground text-sm">
                Halaman {loans.pagination.page} dari{' '}
                {loans.pagination.total_pages}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loans.pagination.page <= 1}
                  onClick={() =>
                    router.push(
                      `?page=${Math.max(1, loans.pagination.page - 1)}`
                    )
                  }
                >
                  Sebelumnya
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    loans.pagination.page >=
                    loans.pagination.total_pages
                  }
                  onClick={() =>
                    router.push(
                      `?page=${Math.min(
                        loans.pagination.total_pages,
                        loans.pagination.page + 1
                      )}`
                    )
                  }
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {reversingLoan ? (
        <CashLoanReversalDialog
          loan={reversingLoan}
          businessDate={businessDate}
          onOpenChange={(open) => {
            if (!open) setReversingLoan(null);
          }}
        />
      ) : null}
    </main>
  );
}

function StatusBadge({
  status,
}: {
  status: FinanceCashLoanSummaryDTO['status'];
}) {
  const label =
    status === 'posted'
      ? 'Posted'
      : status === 'reversed'
        ? 'Dibalik'
        : 'Draft';
  return (
    <Badge
      variant={
        status === 'posted' ? 'secondary' : 'outline'
      }
    >
      {label}
    </Badge>
  );
}

function lenderTypeLabel(type: FinanceCashLoanLenderType) {
  switch (type) {
    case 'owner':
      return 'Pemilik';
    case 'bank':
      return 'Bank';
    case 'digital_lender':
      return 'Penyedia pinjaman digital';
    case 'other':
      return 'Pemberi pinjaman lain';
  }
}

function readErrorMessage(payload: unknown) {
  const parsed = ErrorResponseSchema.safeParse(payload);
  return parsed.success
    ? parsed.data.error.message
    : 'Terjadi kesalahan saat menyimpan transaksi pinjaman.';
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}
