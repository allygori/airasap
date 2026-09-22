'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  FinanceSettlementResponseSchema,
  type FinanceSettlementResponseDTO,
  type FinanceSubledgerBalanceDTO,
  type FinanceSubledgerListResponseDTO,
  type FinanceSubledgerTypeDTO,
} from '@/modules/finance';
import type { FinanceSubledgerPaymentAccountOption } from '../_lib/load-subledger-page-data';

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
};

export function FinanceSubledgerPage({
  balanceType,
  balances,
  paymentAccounts,
}: FinanceSubledgerPageProps) {
  const router = useRouter();
  const [selectedSourceKey, setSelectedSourceKey] =
    useState(balances.balances[0]?.source_key ?? '');
  const [amount, setAmount] = useState('');
  const [settlementDate, setSettlementDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [paymentAccountId, setPaymentAccountId] = useState(
    paymentAccounts[0]?.id ?? ''
  );
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);
  const [successMessage, setSuccessMessage] = useState<
    string | null
  >(null);

  const selectedBalance = balances.balances.find(
    (balance) => balance.source_key === selectedSourceKey
  );
  const isReceivable = balanceType === 'receivable';
  const title = isReceivable ? 'Piutang' : 'Hutang';
  const actionLabel = isReceivable
    ? 'Catat penerimaan'
    : 'Catat pembayaran';

  const submit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
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
              selectedBalance?.source_journal_entry_id,
            ...(selectedBalance?.source_item_id
              ? {
                  source_item_id:
                    selectedBalance.source_item_id,
                }
              : {}),
            amount: Number(amount),
            settlement_date: `${settlementDate}T00:00:00.000Z`,
            payment_account_id: paymentAccountId,
            ...(reference.trim()
              ? { reference: reference.trim() }
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
      setAmount('');
      setReference('');
      router.refresh();
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
              : 'yang masih harus dibayar kepada supplier atau vendor'}
            . Settlement parsial maupun penuh membuat
            journal baru dan tidak mengubah journal asal.
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

      {balances.balances.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Tidak ada saldo terbuka</CardTitle>
            <CardDescription>
              Saldo akan muncul setelah transaksi Finance
              posted dan belum diselesaikan.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm leading-6">
            Journal dari order selesai menjadi piutang
            marketplace. Hutang dari pembelian, expense, dan
            opening balance juga tampil sesuai sumbernya.
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
                      setSelectedSourceKey(
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
              <form
                className="grid gap-4"
                onSubmit={submit}
              >
                <label className="grid gap-2 text-sm font-medium">
                  Sumber saldo
                  <select
                    value={selectedSourceKey}
                    onChange={(event) =>
                      setSelectedSourceKey(
                        event.target.value
                      )
                    }
                    className={InputClass}
                    required
                  >
                    {balances.balances.map((balance) => (
                      <option
                        key={balance.source_key}
                        value={balance.source_key}
                      >
                        {balance.source_label} —{' '}
                        {formatMoney(
                          balance.outstanding_amount
                        )}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Nominal (IDR)
                  <input
                    type="number"
                    min="1"
                    max={
                      selectedBalance?.outstanding_amount
                    }
                    step="1"
                    value={amount}
                    onChange={(event) =>
                      setAmount(event.target.value)
                    }
                    placeholder={
                      selectedBalance
                        ? String(
                            selectedBalance.outstanding_amount
                          )
                        : '100000'
                    }
                    className={InputClass}
                    required
                  />
                  {selectedBalance ? (
                    <span className="text-muted-foreground text-xs">
                      Maksimal{' '}
                      {formatMoney(
                        selectedBalance.outstanding_amount
                      )}
                      .
                    </span>
                  ) : null}
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  {isReceivable
                    ? 'Diterima ke'
                    : 'Dibayar dari'}
                  <select
                    value={paymentAccountId}
                    onChange={(event) =>
                      setPaymentAccountId(
                        event.target.value
                      )
                    }
                    className={InputClass}
                    required
                    disabled={paymentAccounts.length === 0}
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
                <label className="grid gap-2 text-sm font-medium">
                  Tanggal settlement
                  <input
                    type="date"
                    value={settlementDate}
                    onChange={(event) =>
                      setSettlementDate(event.target.value)
                    }
                    className={InputClass}
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Referensi (opsional)
                  <input
                    value={reference}
                    onChange={(event) =>
                      setReference(event.target.value)
                    }
                    maxLength={120}
                    placeholder="Contoh: PAYOUT-001"
                    className={InputClass}
                  />
                </label>

                <div className="border-info/30 bg-info/5 text-info-foreground rounded-lg border px-3 py-3 text-xs leading-5">
                  Jatuh tempo belum diatur pada source
                  transaction. Finance tidak menandai
                  transaksi sebagai overdue secara otomatis.
                </div>
                {errorMessage ? (
                  <div
                    role="alert"
                    className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-3 text-sm"
                  >
                    {errorMessage}
                  </div>
                ) : null}
                {successMessage ? (
                  <div
                    role="status"
                    className="border-success/30 bg-success/10 text-success rounded-lg border px-3 py-3 text-sm"
                  >
                    {successMessage}
                  </div>
                ) : null}
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    paymentAccounts.length === 0 ||
                    !selectedBalance
                  }
                >
                  {isSubmitting
                    ? 'Mem-posting…'
                    : actionLabel}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
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
