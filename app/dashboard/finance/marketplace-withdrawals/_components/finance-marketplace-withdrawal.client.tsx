'use client';

import { revalidateLogic } from '@tanstack/react-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';
import { useAppForm } from '@/components/form/form.hook';
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
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { formatMediumDate } from '@/lib/date';
import { formatIDR } from '@/lib/number/money';
import {
  FinanceCashBankTransferResponseSchema,
  type FinanceCashBankAccountDTO,
  type FinanceCashBankTransferSummaryDTO,
} from '@/modules/finance/client';
import {
  createMarketplaceWithdrawalFormDefaults,
  MarketplaceWithdrawalForm,
} from './marketplace-withdrawal.form';
import {
  FinanceMarketplaceWithdrawalFormSchema,
  type FinanceMarketplaceWithdrawalFormValues,
} from './finance-marketplace-withdrawal-form.schema';

const ActionResponseSchema = z.object({
  success: z.literal(true),
  data: FinanceCashBankTransferResponseSchema,
});

const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({ message: z.string() }),
});

type FinanceMarketplaceWithdrawalClientProps = {
  marketplaceBalance: FinanceCashBankAccountDTO | null;
  destinations: FinanceCashBankAccountDTO[];
  withdrawals: FinanceCashBankTransferSummaryDTO[];
  pendingWithdrawalCount: number;
};

export function FinanceMarketplaceWithdrawalClient({
  marketplaceBalance,
  destinations,
  withdrawals,
  pendingWithdrawalCount,
}: FinanceMarketplaceWithdrawalClientProps) {
  const router = useRouter();
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);
  const [successMessage, setSuccessMessage] = useState<
    string | null
  >(null);
  const [retryingWithdrawalId, setRetryingWithdrawalId] =
    useState<string | null>(null);
  const [historyMessage, setHistoryMessage] = useState<{
    kind: 'error' | 'success';
    text: string;
  } | null>(null);
  const withdrawableBalance = Math.max(
    0,
    marketplaceBalance?.current_balance ?? 0
  );

  const submit = async (
    values: FinanceMarketplaceWithdrawalFormValues
  ) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const amount = Number(values.amount);
    if (amount > withdrawableBalance) {
      setErrorMessage(
        'Nominal penarikan melebihi Saldo Marketplace yang tersedia. Muat ulang halaman untuk melihat saldo terbaru.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        '/api/v1/dashboard/finance/marketplace-withdrawals',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destination_account_id:
              values.destination_account_id,
            amount,
            transaction_date: `${values.transaction_date}T00:00:00.000Z`,
            ...(values.reference.trim()
              ? { reference: values.reference.trim() }
              : {}),
            ...(values.description.trim()
              ? { description: values.description.trim() }
              : {}),
            idempotency_key: idempotencyKey,
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

      const transfer = parsed.data.data;
      setSuccessMessage(
        `${formatIDR(transfer.amount)} berhasil ditarik ke ${transfer.destination_account.name}. Journal penarikan sudah dibuat.`
      );
      form.setFieldValue('amount', '');
      form.setFieldValue('reference', '');
      form.setFieldValue('description', '');
      setIdempotencyKey(crypto.randomUUID());
      router.refresh();
    } catch {
      setErrorMessage(
        'Tidak dapat menghubungi server Finance.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const retryPendingWithdrawal = async (
    withdrawal: FinanceCashBankTransferSummaryDTO
  ) => {
    setHistoryMessage(null);
    setRetryingWithdrawalId(withdrawal.transfer_id);

    try {
      const response = await fetch(
        '/api/v1/dashboard/finance/marketplace-withdrawals',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destination_account_id:
              withdrawal.destination_account.id,
            amount: withdrawal.amount,
            transaction_date: withdrawal.transaction_date,
            ...(withdrawal.reference
              ? { reference: withdrawal.reference }
              : {}),
            description: withdrawal.description,
            idempotency_key: withdrawal.idempotency_key,
          }),
        }
      );
      const payload: unknown = await response.json();

      if (!response.ok) {
        setHistoryMessage({
          kind: 'error',
          text: getErrorMessage(payload),
        });
        return;
      }

      const parsed =
        ActionResponseSchema.safeParse(payload);
      if (!parsed.success) {
        setHistoryMessage({
          kind: 'error',
          text: 'Respons server Finance tidak valid.',
        });
        return;
      }

      const transfer = parsed.data.data;
      setHistoryMessage({
        kind: 'success',
        text: `${formatIDR(transfer.amount)} berhasil diposting ke ${transfer.destination_account.name}.`,
      });
      router.refresh();
    } catch {
      setHistoryMessage({
        kind: 'error',
        text: 'Tidak dapat menghubungi server Finance. Coba lagi dengan tombol yang sama.',
      });
    } finally {
      setRetryingWithdrawalId(null);
    }
  };

  const form = useAppForm({
    defaultValues:
      createMarketplaceWithdrawalFormDefaults(destinations),
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: FinanceMarketplaceWithdrawalFormSchema,
    },
    onSubmit: async ({ value }) => submit(value),
  });

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
            Finance / Transaksi
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Penarikan Marketplace
          </h1>
          <p className="text-muted-foreground leading-7">
            Catat pemindahan dana yang Anda tarik secara
            manual dari saldo Shopee ke akun Bank atau
            E-wallet.
          </p>
        </div>
        <Link
          href="/dashboard/finance/cash-and-bank"
          className="text-primary text-sm font-medium underline-offset-4 hover:underline"
        >
          Lihat saldo Cash &amp; Bank →
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.55fr)]">
        <div className="grid min-w-0 gap-6">
          <Card className="max-w-3xl">
            <CardHeader className="border-b">
              <CardTitle>
                Saldo yang dapat ditarik
              </CardTitle>
              <CardDescription>
                Jurnal released funds menambah 1220 Saldo
                Marketplace dan mengurangi 1210 Piutang
                Marketplace. Halaman ini hanya mencatat
                penarikan dari saldo 1220 ke Bank/E-wallet.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {marketplaceBalance ? (
                <div className="bg-muted/30 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">
                      {marketplaceBalance.code} —{' '}
                      {marketplaceBalance.name}
                    </p>
                    <p className="mt-1 font-mono text-2xl font-semibold">
                      {formatIDR(withdrawableBalance)}
                    </p>
                  </div>
                  <Badge variant="outline">
                    Dapat ditarik
                  </Badge>
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertDescription>
                    Akun 1220 Saldo Marketplace aktif belum
                    tersedia. Periksa Chart of Accounts
                    sebelum mencatat penarikan.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {marketplaceBalance &&
          destinations.length > 0 &&
          withdrawableBalance > 0 ? (
            <Card className="max-w-3xl">
              <CardHeader className="border-b">
                <CardTitle>Catat penarikan baru</CardTitle>
                <CardDescription>
                  Masukkan jumlah yang benar-benar ditarik
                  di aplikasi Shopee. Penarikan parsial
                  diperbolehkan selama tidak melebihi saldo
                  buku.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <MarketplaceWithdrawalForm
                  form={form}
                  destinations={destinations}
                  withdrawableBalance={withdrawableBalance}
                  isSubmitting={
                    isSubmitting ||
                    retryingWithdrawalId !== null
                  }
                  errorMessage={errorMessage}
                  successMessage={successMessage}
                />
              </CardContent>
            </Card>
          ) : null}

          {marketplaceBalance &&
          destinations.length === 0 ? (
            <Card className="max-w-3xl">
              <CardHeader>
                <CardTitle>
                  Akun tujuan belum tersedia
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-7">
                Tambahkan akun Bank atau E-wallet aktif
                terlebih dahulu di{' '}
                <Link
                  href="/dashboard/finance/cash-and-bank"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Cash &amp; Bank
                </Link>
                .
              </CardContent>
            </Card>
          ) : null}

          {marketplaceBalance &&
          destinations.length > 0 &&
          withdrawableBalance === 0 ? (
            <Alert>
              <AlertDescription>
                Belum ada saldo Marketplace yang dapat
                ditarik. Saldo bertambah saat dana released
                Shopee diposting.
              </AlertDescription>
            </Alert>
          ) : null}
        </div>

        <Card className="border-l-primary h-fit border-l-4">
          <CardHeader>
            <CardTitle>Alur saldo Shopee</CardTitle>
            <CardDescription>
              Piutang dan saldo withdrawable bertambah pada
              tahap berbeda.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm leading-6">
            <p>
              Order selesai: debit 1210 Piutang Marketplace
              dan credit Pendapatan.
            </p>
            <p>
              Released funds: debit 1220 sebesar dana
              bersih, debit 6310 sebesar fee, dan credit
              1210 sebesar piutang yang dilunasi.
            </p>
            <p>
              Penarikan di halaman ini: debit Bank/E-wallet
              dan credit 1220 sebesar nominal aktual.
            </p>
            <p className="text-muted-foreground">
              Penarikan adalah perpindahan aset, bukan
              pendapatan atau biaya. Jurnalnya dapat
              ditelusuri dari riwayat penarikan.
            </p>
          </CardContent>
        </Card>
      </div>

      <WithdrawalHistory
        withdrawals={withdrawals}
        pendingWithdrawalCount={pendingWithdrawalCount}
        isSubmitting={isSubmitting}
        retryingWithdrawalId={retryingWithdrawalId}
        historyMessage={historyMessage}
        onRetry={retryPendingWithdrawal}
      />
    </div>
  );
}

function WithdrawalHistory({
  withdrawals,
  pendingWithdrawalCount,
  isSubmitting,
  retryingWithdrawalId,
  historyMessage,
  onRetry,
}: {
  withdrawals: FinanceCashBankTransferSummaryDTO[];
  pendingWithdrawalCount: number;
  isSubmitting: boolean;
  retryingWithdrawalId: string | null;
  historyMessage: {
    kind: 'error' | 'success';
    text: string;
  } | null;
  onRetry: (
    withdrawal: FinanceCashBankTransferSummaryDTO
  ) => void;
}) {
  const visiblePendingCount = withdrawals.filter(
    (withdrawal) => withdrawal.status === 'pending'
  ).length;

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Riwayat penarikan</CardTitle>
        <CardDescription>
          Penarikan pending ditampilkan untuk dicoba lagi;
          riwayat juga menampilkan 10 transaksi terbaru.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {historyMessage ? (
          <Alert
            className="m-4"
            variant={
              historyMessage.kind === 'error'
                ? 'destructive'
                : 'default'
            }
            role={
              historyMessage.kind === 'error'
                ? 'alert'
                : 'status'
            }
          >
            <AlertDescription>
              {historyMessage.text}
            </AlertDescription>
          </Alert>
        ) : null}
        {pendingWithdrawalCount > visiblePendingCount ? (
          <Alert className="m-4">
            <AlertDescription>
              Menampilkan {visiblePendingCount} dari{' '}
              {pendingWithdrawalCount} penarikan pending.
            </AlertDescription>
          </Alert>
        ) : null}
        {withdrawals.length === 0 ? (
          <div className="text-muted-foreground px-6 py-10 text-center text-sm">
            Belum ada penarikan Marketplace.
          </div>
        ) : (
          <div className="divide-y">
            {withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.transfer_id}
                className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">
                      {withdrawal.source_account.name} →{' '}
                      {withdrawal.destination_account.name}
                    </p>
                    <WithdrawalStatusBadge
                      status={withdrawal.status}
                    />
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {formatMediumDate(
                      withdrawal.transaction_date
                    )}
                    {withdrawal.reference
                      ? ` · ${withdrawal.reference}`
                      : ''}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {withdrawal.description}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
                  <span className="font-mono text-sm font-semibold">
                    {formatIDR(withdrawal.amount)}
                  </span>
                  {withdrawal.journal_entry_id ? (
                    <Link
                      href={`/dashboard/finance/accounting/general-journal/${withdrawal.journal_entry_id}`}
                      className="text-primary text-xs font-medium underline-offset-4 hover:underline"
                    >
                      Journal
                    </Link>
                  ) : null}
                  {withdrawal.status === 'pending' ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={
                        isSubmitting ||
                        retryingWithdrawalId !== null
                      }
                      onClick={() => onRetry(withdrawal)}
                    >
                      {retryingWithdrawalId ===
                      withdrawal.transfer_id
                        ? 'Mencoba posting…'
                        : 'Coba posting lagi'}
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

function WithdrawalStatusBadge({
  status,
}: {
  status: 'pending' | 'posted' | 'reversed';
}) {
  return (
    <Badge
      variant={
        status === 'posted'
          ? 'success'
          : status === 'reversed'
            ? 'warning'
            : 'info'
      }
    >
      {status === 'posted'
        ? 'Posted'
        : status === 'reversed'
          ? 'Reversed'
          : 'Pending'}
    </Badge>
  );
}

function getErrorMessage(payload: unknown) {
  const parsed = ErrorResponseSchema.safeParse(payload);
  return parsed.success
    ? parsed.data.error.message
    : 'Penarikan Marketplace gagal diposting.';
}
