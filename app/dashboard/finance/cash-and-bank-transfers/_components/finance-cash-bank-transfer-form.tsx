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
  FinanceCashBankTransferResponseSchema,
  FINANCE_CASH_BANK_SUBTYPE_LABELS,
  type FinanceCashBankAccountDTO,
} from '@/modules/finance';

const ActionResponseSchema = z.object({
  success: z.literal(true),
  data: FinanceCashBankTransferResponseSchema,
});

const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({ message: z.string() }),
});

export function FinanceCashBankTransferForm({
  accounts,
}: {
  accounts: FinanceCashBankAccountDTO[];
}) {
  const [sourceAccountId, setSourceAccountId] = useState(
    accounts[0]?.id ?? ''
  );
  const [destinationAccountId, setDestinationAccountId] =
    useState(accounts[1]?.id ?? accounts[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
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

  const sourceAccount = accounts.find(
    (account) => account.id === sourceAccountId
  );
  const destinationAccount = accounts.find(
    (account) => account.id === destinationAccountId
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
        '/api/v1/dashboard/finance/cash-and-bank-transfers',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_account_id: sourceAccountId,
            destination_account_id: destinationAccountId,
            amount: Number(amount),
            transaction_date: `${transactionDate}T00:00:00.000Z`,
            ...(reference.trim()
              ? { reference: reference.trim() }
              : {}),
            ...(description.trim()
              ? { description: description.trim() }
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
        `${formatMoney(transfer.amount)} berhasil dipindahkan dari ${transfer.source_account.name} ke ${transfer.destination_account.name}. Journal baru sudah dibuat.`
      );
      setAmount('');
      setReference('');
      setDescription('');
      setIdempotencyKey(crypto.randomUUID());
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
            Finance / Transaksi
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Transfer Kas & Bank
          </h1>
          <p className="text-muted-foreground leading-7">
            Pindahkan saldo antar akun Finance tanpa
            mengubah journal yang sudah posted. Setiap
            transfer membuat journal baru yang dapat
            ditelusuri.
          </p>
        </div>
        <Link
          href="/dashboard/finance/cash-and-bank"
          className="text-primary text-sm font-medium underline-offset-4 hover:underline"
        >
          Lihat saldo Cash & Bank →
        </Link>
      </div>

      {accounts.length < 2 ? (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Akun transfer belum siap</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground leading-7">
            Transfer membutuhkan minimal dua akun postable
            dari kategori Kas, Bank, E-wallet, atau Saldo
            Marketplace. Aktifkan akun yang sesuai di Chart
            of Accounts terlebih dahulu.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.55fr)]">
          <Card className="max-w-3xl">
            <CardHeader className="border-b">
              <CardTitle>Transfer baru</CardTitle>
              <CardDescription>
                Transfer langsung posted setelah berhasil.
                Tidak ada bank feed atau import mutasi pada
                phase ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form
                onSubmit={submit}
                className="grid gap-5"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <AccountSelect
                    label="Dari akun"
                    value={sourceAccountId}
                    accounts={accounts}
                    onChange={setSourceAccountId}
                  />
                  <AccountSelect
                    label="Ke akun"
                    value={destinationAccountId}
                    accounts={accounts}
                    onChange={setDestinationAccountId}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">
                    Jumlah transfer (IDR)
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={amount}
                      onChange={(event) =>
                        setAmount(event.target.value)
                      }
                      placeholder="Contoh: 500000"
                      className={InputClass}
                      required
                    />
                  </label>
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
                      className={InputClass}
                      required
                    />
                  </label>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">
                    Referensi (opsional)
                    <input
                      value={reference}
                      onChange={(event) =>
                        setReference(event.target.value)
                      }
                      maxLength={120}
                      placeholder="Contoh: Setoran kas 001"
                      className={InputClass}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Deskripsi (opsional)
                    <input
                      value={description}
                      onChange={(event) =>
                        setDescription(event.target.value)
                      }
                      maxLength={500}
                      placeholder="Contoh: Pindah dana operasional"
                      className={InputClass}
                    />
                  </label>
                </div>

                {sourceAccount && destinationAccount ? (
                  <div className="bg-muted/30 grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
                    <BalanceHint
                      label="Saldo sumber"
                      account={sourceAccount}
                    />
                    <BalanceHint
                      label="Saldo tujuan"
                      account={destinationAccount}
                    />
                  </div>
                ) : null}

                {sourceAccountId ===
                destinationAccountId ? (
                  <div className="border-warning/30 bg-warning/5 text-warning-foreground rounded-lg border px-4 py-3 text-sm">
                    Pilih akun sumber dan tujuan yang
                    berbeda.
                  </div>
                ) : null}

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
                    disabled={
                      isSubmitting ||
                      sourceAccountId ===
                        destinationAccountId
                    }
                  >
                    {isSubmitting
                      ? 'Mem-posting...'
                      : 'Post transfer'}
                  </Button>
                  <Badge variant="outline">
                    Journal baru & immutable
                  </Badge>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-l-primary h-fit border-l-4">
            <CardHeader>
              <CardTitle>Yang perlu diketahui</CardTitle>
              <CardDescription>
                Transfer adalah perpindahan aset, bukan
                pendapatan atau biaya.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm leading-6">
              <p>
                Debit akun tujuan dan credit akun sumber
                dengan jumlah yang sama.
              </p>
              <p>
                Transfer langsung mengurangi saldo sumber
                dan menambah saldo tujuan.
              </p>
              <p className="text-muted-foreground">
                Jika request terkirim ulang dengan
                idempotency key yang sama, Finance
                mengembalikan transfer yang sama tanpa
                membuat journal duplikat.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function AccountSelect({
  label,
  value,
  accounts,
  onChange,
}: {
  label: string;
  value: string;
  accounts: FinanceCashBankAccountDTO[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={InputClass}
        required
      >
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.code} — {account.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function BalanceHint({
  label,
  account,
}: {
  label: string;
  account: FinanceCashBankAccountDTO;
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs uppercase">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm font-semibold">
        {formatMoney(account.current_balance)}
      </p>
      <p className="text-muted-foreground mt-1 text-xs">
        {FINANCE_CASH_BANK_SUBTYPE_LABELS[account.subtype]}
      </p>
    </div>
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

function getErrorMessage(payload: unknown) {
  const parsed = ErrorResponseSchema.safeParse(payload);
  return parsed.success
    ? parsed.data.error.message
    : 'Transfer Kas & Bank gagal diposting.';
}
