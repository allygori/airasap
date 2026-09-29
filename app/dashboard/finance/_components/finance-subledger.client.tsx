'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  revalidateLogic,
  useStore,
} from '@tanstack/react-form';
import { z } from 'zod';
import { useAppForm } from '@/components/form/form.hook';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FinanceSettlementResponseSchema,
  type FinanceSettlementResponseDTO,
  type FinanceCashLoanBalanceDTO,
  type FinanceSubledgerBalanceDTO,
  type FinanceSubledgerListResponseDTO,
  type FinanceSubledgerTypeDTO,
} from '@/modules/finance/client';
import type { FinanceSubledgerPaymentAccountOption } from '../_lib/load-subledger-page-data';
import {
  SubledgerSettlementForm,
  createSubledgerSettlementFormDefaults,
} from './subledger-settlement.form';
import {
  createFinanceSubledgerSettlementFormSchema,
  type FinanceSubledgerSettlementFormValues,
} from './finance-subledger-settlement-form.schema';

const ActionResponseSchema = z.object({
  success: z.literal(true),
  data: FinanceSettlementResponseSchema,
});

const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({ message: z.string() }),
});

type FinanceSubledgerPageProps = {
  balanceType: FinanceSubledgerTypeDTO;
  balances: FinanceSubledgerListResponseDTO;
  paymentAccounts: FinanceSubledgerPaymentAccountOption[];
  cashLoanBalances?: FinanceCashLoanBalanceDTO[];
};

export function FinanceSubledgerPage({
  balanceType,
  balances,
  paymentAccounts,
  cashLoanBalances = [],
}: FinanceSubledgerPageProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);
  const [successMessage, setSuccessMessage] = useState<
    string | null
  >(null);

  const isReceivable = balanceType === 'receivable';
  const title = isReceivable ? 'Piutang' : 'Hutang';
  const actionLabel = isReceivable
    ? 'Catat penerimaan'
    : 'Catat pembayaran';
  const openCashLoanBalances = cashLoanBalances.filter(
    (balance) => balance.outstanding_amount > 0
  );

  const submit = async (
    values: FinanceSubledgerSettlementFormValues
  ) => {
    const selectedBalance = balances.balances.find(
      (balance) => balance.source_key === values.source_key
    );
    if (!selectedBalance) {
      setErrorMessage(
        'Pilih saldo yang ingin diselesaikan.'
      );
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        '/api/v1/dashboard/finance/receivables-and-payables/settlements',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            balance_type: balanceType,
            source_journal_entry_id:
              selectedBalance.source_journal_entry_id,
            ...(selectedBalance.source_item_id
              ? {
                  source_item_id:
                    selectedBalance.source_item_id,
                }
              : {}),
            amount: Number(values.amount),
            settlement_date: `${values.settlement_date}T00:00:00.000Z`,
            payment_account_id: values.payment_account_id,
            ...(values.reference.trim()
              ? { reference: values.reference.trim() }
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

      setSuccessMessage(
        getSuccessMessage(parsed.data.data, isReceivable)
      );
      form.setFieldValue('amount', '');
      form.setFieldValue('reference', '');
      router.refresh();
    } catch {
      setErrorMessage(
        'Tidak dapat menghubungi server Finance.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const form = useAppForm({
    defaultValues: createSubledgerSettlementFormDefaults(
      balances.balances,
      paymentAccounts
    ),
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: createFinanceSubledgerSettlementFormSchema(
        {
          balances: balances.balances,
          paymentAccounts,
        }
      ),
    },
    onSubmit: async ({ value }) => submit(value),
  });

  const selectedSourceKey = useStore(
    form.store,
    (state) => state.values.source_key
  );

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
            Finance / Saldo terbuka
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight">
            {title}
          </h1>
          <p className="text-muted-foreground leading-7">
            Lihat saldo{' '}
            {isReceivable
              ? 'yang masih harus diterima dari marketplace'
              : 'utang usaha yang masih harus dibayar kepada supplier atau vendor'}
            . Settlement membuat journal baru dan tidak
            mengubah journal asal.
            {!isReceivable
              ? ' Sisa pokok Pinjaman Tunai, jika ada, ditampilkan terpisah dengan alur pembayaran tersendiri.'
              : null}
          </p>
        </div>
        <Link
          href={
            isReceivable
              ? '/dashboard/finance/accounts-payable'
              : '/dashboard/finance/accounts-receivable'
          }
          className="text-primary text-sm font-medium underline-offset-4 hover:underline"
        >
          Lihat {isReceivable ? 'hutang' : 'piutang'} →
        </Link>
      </div>

      {!isReceivable && openCashLoanBalances.length > 0 ? (
        <CashLoanBalanceCard
          balances={openCashLoanBalances}
        />
      ) : null}

      {balances.balances.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {isReceivable
                ? 'Tidak ada saldo terbuka'
                : 'Tidak ada utang usaha terbuka'}
            </CardTitle>
            <CardDescription>
              {isReceivable
                ? 'Saldo akan muncul setelah transaksi Finance posted dan belum diselesaikan.'
                : 'Saldo akan muncul setelah pembelian atau transaksi utang usaha diposting.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm leading-6">
            {isReceivable ? (
              'Journal dari order selesai menjadi piutang marketplace.'
            ) : (
              <>
                Pinjaman tunai ditampilkan terpisah dari
                utang usaha.{' '}
                <Link
                  href="/dashboard/finance/cash-loans"
                  className="text-primary font-medium underline-offset-4 hover:underline"
                >
                  Buka Pinjaman Tunai
                </Link>
                .
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.55fr)]">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Saldo terbuka</CardTitle>
              <CardDescription>
                Nominal di bawah adalah outstanding setelah
                dikurangi settlement yang sudah posted.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {balances.balances.map((balance) => (
                  <BalanceRow
                    key={balance.source_key}
                    balance={balance}
                    selected={
                      selectedSourceKey ===
                      balance.source_key
                    }
                    onSelect={() =>
                      form.setFieldValue(
                        'source_key',
                        balance.source_key
                      )
                    }
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-primary h-fit border-l-4">
            <CardHeader>
              <CardTitle>{actionLabel}</CardTitle>
              <CardDescription>
                Pilih saldo lalu isi nominal yang
                benar-benar diterima atau dibayar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubledgerSettlementForm
                form={form}
                balances={balances.balances}
                paymentAccounts={paymentAccounts}
                isReceivable={isReceivable}
                actionLabel={actionLabel}
                isSubmitting={isSubmitting}
                errorMessage={errorMessage}
                successMessage={successMessage}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function CashLoanBalanceCard({
  balances,
}: {
  balances: FinanceCashLoanBalanceDTO[];
}) {
  const totalOutstanding = balances.reduce(
    (total, balance) => total + balance.outstanding_amount,
    0
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="grid gap-1">
          <CardTitle>Pinjaman tunai</CardTitle>
          <CardDescription>
            Sisa pokok pinjaman yang belum dibayar.
            Pembayaran dicatat melalui alur Pinjaman Tunai.
          </CardDescription>
        </div>
        <Link
          href="/dashboard/finance/cash-loans"
          className="text-primary shrink-0 text-sm font-medium underline-offset-4 hover:underline"
        >
          Kelola pinjaman →
        </Link>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3">
          <span className="text-muted-foreground text-sm">
            Total sisa pokok
          </span>
          <span className="font-mono text-lg font-semibold">
            {formatMoney(totalOutstanding)}
          </span>
        </div>
        <div className="divide-y rounded-lg border">
          {balances.map((balance) => (
            <div
              key={balance.lender.key}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {balance.lender.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {getLenderTypeLabel(balance.lender.type)}
                </p>
              </div>
              <span className="font-mono text-sm font-semibold">
                {formatMoney(balance.outstanding_amount)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BalanceRow({
  balance,
  selected,
  onSelect,
}: {
  balance: FinanceSubledgerBalanceDTO;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`hover:bg-muted/40 grid w-full gap-3 px-6 py-4 text-left transition-colors sm:grid-cols-[minmax(0,1fr)_auto] ${selected ? 'bg-primary/5 ring-primary/30 ring-1 ring-inset' : ''}`}
    >
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium">
            {balance.source_label}
          </span>
          <Badge
            variant={
              balance.settlement_status === 'partial'
                ? 'info'
                : 'warning'
            }
          >
            {balance.settlement_status === 'partial'
              ? 'Partial'
              : 'Open'}
          </Badge>
        </span>
        <span className="text-muted-foreground mt-1 block text-xs">
          {balance.description} ·{' '}
          {formatDate(balance.transaction_date)} ·{' '}
          {balance.overdue_status === 'not_configured'
            ? 'Jatuh tempo belum diatur'
            : balance.overdue_status}
        </span>
      </span>
      <span className="text-left sm:text-right">
        <span className="block font-mono text-sm font-semibold">
          {formatMoney(balance.outstanding_amount)}
        </span>
        <span className="text-muted-foreground block text-xs">
          dari {formatMoney(balance.original_amount)}
        </span>
      </span>
    </button>
  );
}

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

function getLenderTypeLabel(
  type: FinanceCashLoanBalanceDTO['lender']['type']
) {
  switch (type) {
    case 'owner':
      return 'Pemilik';
    case 'bank':
      return 'Bank';
    case 'digital_lender':
      return 'Pemberi pinjaman digital';
    default:
      return 'Pemberi pinjaman lainnya';
  }
}

function getSuccessMessage(
  settlement: FinanceSettlementResponseDTO,
  isReceivable: boolean
) {
  return `${isReceivable ? 'Penerimaan piutang' : 'Pembayaran hutang'} ${formatMoney(settlement.amount)} berhasil diposting sebagai journal baru.`;
}

function getErrorMessage(payload: unknown) {
  const parsed = ErrorResponseSchema.safeParse(payload);
  return parsed.success
    ? parsed.data.error.message
    : 'Settlement Finance gagal diproses.';
}
