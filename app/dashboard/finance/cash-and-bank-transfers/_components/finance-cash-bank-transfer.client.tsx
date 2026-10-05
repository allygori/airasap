'use client';

import { formatMediumDate as formatDate } from '@/lib/date';
import { formatIDR as formatMoney } from '@/lib/number/money';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { revalidateLogic } from '@tanstack/react-form';
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
  FinanceCashBankTransferResponseSchema,
  type FinanceCashBankAccountDTO,
  type FinanceCashBankTransferListResponseDTO,
  type FinanceCashBankTransferSummaryDTO,
} from '@/modules/finance/client';
import {
  CashBankTransferForm,
  createCashBankTransferFormDefaults,
} from './cash-bank-transfer.form';
import {
  FinanceCashBankTransferFormSchema,
  type FinanceCashBankTransferFormValues,
} from './finance-cash-bank-transfer-form.schema';

const ActionResponseSchema = z.object({
  success: z.literal(true),
  data: FinanceCashBankTransferResponseSchema,
});

const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({ message: z.string() }),
});

type FinanceCashBankTransferClientProps = {
  accounts: FinanceCashBankAccountDTO[];
  transfers: FinanceCashBankTransferListResponseDTO;
};

export function FinanceCashBankTransferClient({
  accounts,
  transfers,
}: FinanceCashBankTransferClientProps) {
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
  const [reversingId, setReversingId] = useState<
    string | null
  >(null);

  const submit = async (
    values: FinanceCashBankTransferFormValues
  ) => {
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
            source_account_id: values.source_account_id,
            destination_account_id:
              values.destination_account_id,
            amount: Number(values.amount),
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
        `${formatMoney(transfer.amount)} berhasil dipindahkan dari ${transfer.source_account.name} ke ${transfer.destination_account.name}. Journal baru sudah dibuat.`
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

  const form = useAppForm({
    defaultValues:
      createCashBankTransferFormDefaults(accounts),
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: FinanceCashBankTransferFormSchema,
    },
    onSubmit: async ({ value }) => submit(value),
  });

  const reverseTransfer = async (
    transfer: FinanceCashBankTransferSummaryDTO
  ) => {
    if (
      !window.confirm(
        `Reverse transfer ${transfer.source_account.name} ke ${transfer.destination_account.name}?`
      )
    ) {
      return;
    }

    setReversingId(transfer.transfer_id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        `/api/v1/dashboard/finance/cash-and-bank-transfers/${transfer.transfer_id}/reverse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: `Reversal transfer ${transfer.reference ?? transfer.transfer_id}`,
            idempotency_key: `finance-cash-bank-transfer-reversal:${transfer.transfer_id}`,
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
        'Transfer berhasil direverse dengan journal baru.'
      );
      router.refresh();
    } catch {
      setErrorMessage(
        'Tidak dapat menghubungi server Finance.'
      );
    } finally {
      setReversingId(null);
    }
  };

  const hasTwoAccounts = accounts.length >= 2;

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
            Finance / Transaksi
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Transfer Kas &amp; Bank
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
          Lihat saldo Cash &amp; Bank →
        </Link>
      </div>

      {!hasTwoAccounts ? (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Akun transfer belum siap</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground leading-7">
            Transfer membutuhkan minimal dua akun postable
            dari kategori Kas, Bank, atau E-wallet. Aktifkan
            akun yang sesuai di Chart of Accounts terlebih
            dahulu. Penarikan dari Saldo Marketplace dicatat
            melalui halaman Penarikan Marketplace.
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
              <CashBankTransferForm
                form={form}
                accounts={accounts}
                isSubmitting={isSubmitting}
                errorMessage={errorMessage}
                successMessage={successMessage}
              />
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
                Request dengan idempotency key yang sama
                tidak membuat journal duplikat.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <TransferHistory
        transfers={transfers.transfers}
        reversingId={reversingId}
        onReverse={reverseTransfer}
      />
    </div>
  );
}

function TransferHistory({
  transfers,
  reversingId,
  onReverse,
}: {
  transfers: FinanceCashBankTransferSummaryDTO[];
  reversingId: string | null;
  onReverse: (
    transfer: FinanceCashBankTransferSummaryDTO
  ) => void;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Riwayat transfer</CardTitle>
        <CardDescription>
          Transfer posted dapat dikoreksi melalui reversal.
          Journal asal tetap tersimpan dan tidak diedit.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {transfers.length === 0 ? (
          <div className="text-muted-foreground px-6 py-10 text-center text-sm">
            Belum ada transfer Kas &amp; Bank.
          </div>
        ) : (
          <div className="divide-y">
            {transfers.map((transfer) => (
              <div
                key={transfer.transfer_id}
                className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">
                      {transfer.source_account.name} →{' '}
                      {transfer.destination_account.name}
                    </p>
                    <TransferStatusBadge
                      status={transfer.status}
                    />
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {formatDate(transfer.transaction_date)}
                    {transfer.reference
                      ? ` · ${transfer.reference}`
                      : ''}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {transfer.description}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
                  <span className="font-mono text-sm font-semibold">
                    {formatMoney(transfer.amount)}
                  </span>
                  {transfer.journal_entry_id ? (
                    <Link
                      href={`/dashboard/finance/accounting/general-journal/${transfer.journal_entry_id}`}
                      className="text-primary text-xs font-medium underline-offset-4 hover:underline"
                    >
                      Journal
                    </Link>
                  ) : null}
                  {transfer.status === 'posted' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        reversingId === transfer.transfer_id
                      }
                      onClick={() => onReverse(transfer)}
                    >
                      {reversingId === transfer.transfer_id
                        ? 'Mereverse…'
                        : 'Reverse'}
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

function TransferStatusBadge({
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
    : 'Transfer Kas & Bank gagal diposting.';
}
