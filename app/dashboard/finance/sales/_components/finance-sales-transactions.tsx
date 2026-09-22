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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  FinanceSalesTransactionListQueryDTO,
  FinanceSalesTransactionListResponseDTO,
} from '@/modules/finance';
import { FinanceSalesWorkflowResultSchema } from '@/modules/finance/sales/finance-sales.schema';

const ActionResponseSchema = z.object({
  success: z.literal(true),
  data: FinanceSalesWorkflowResultSchema,
});

export function FinanceSalesTransactions({
  data,
  query,
}: {
  data: FinanceSalesTransactionListResponseDTO;
  query: FinanceSalesTransactionListQueryDTO;
}) {
  const router = useRouter();
  const [workingId, setWorkingId] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const postTransaction = async (
    transactionId: string,
    action: 'post' | 'retry'
  ) => {
    setWorkingId(transactionId);
    setError(null);

    try {
      const response = await fetch(
        `/api/v1/dashboard/finance/sales/${transactionId}/${action}`,
        { method: 'POST' }
      );
      const payload: unknown = await response.json();

      if (!response.ok) {
        setError(getErrorMessage(payload));
        return;
      }

      const parsed =
        ActionResponseSchema.safeParse(payload);
      if (!parsed.success) {
        setError('Respons server Finance tidak valid.');
        return;
      }

      router.refresh();
    } catch {
      setError('Tidak dapat menghubungi server Finance.');
    } finally {
      setWorkingId(null);
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
            Penjualan
          </h1>
          <p className="text-muted-foreground leading-7">
            Pantau transaksi sales yang menunggu posting,
            terblokir, sudah masuk journal, atau sudah
            direverse.
          </p>
        </div>
        <Link
          href="/dashboard/finance/accounting/general-journal"
          className="text-primary text-sm font-medium underline-offset-4 hover:underline"
        >
          Lihat General Journal →
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Transaksi ditemukan"
          value={data.pagination.total}
        />
        <SummaryCard
          label="Pending / blocked"
          value={
            data.transactions.filter(
              (item) =>
                item.status === 'pending' ||
                item.status === 'blocked'
            ).length
          }
        />
        <SummaryCard
          label="Sudah posted"
          value={
            data.transactions.filter(
              (item) => item.status === 'posted'
            ).length
          }
        />
      </div>

      {error ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm"
        >
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader className="gap-4 border-b lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Work item penjualan</CardTitle>
            <CardDescription>
              Page {data.pagination.page} dari{' '}
              {data.pagination.total_pages || 1}
            </CardDescription>
          </div>
          <form
            method="get"
            className="flex w-full flex-col gap-2 sm:flex-row sm:items-end lg:w-auto"
          >
            <label className="grid gap-1 text-xs font-medium">
              Cari
              <input
                name="search"
                type="search"
                placeholder="Nomor, source ID, alasan"
                defaultValue={query.search ?? ''}
                className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3 sm:w-56"
              />
            </label>
            <label className="grid gap-1 text-xs font-medium">
              Status
              <select
                name="status"
                defaultValue={query.status ?? ''}
                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"
              >
                <option value="">Semua status</option>
                <option value="pending">Pending</option>
                <option value="blocked">Blocked</option>
                <option value="posted">Posted</option>
                <option value="reversed">Reversed</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-medium">
              Mode
              <select
                name="posting_mode"
                defaultValue={query.posting_mode ?? ''}
                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"
              >
                <option value="">Semua mode</option>
                <option value="manual">Manual</option>
                <option value="automatic">Automatic</option>
              </select>
            </label>
            <Button type="submit" variant="secondary">
              Terapkan
            </Button>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          {data.transactions.length === 0 ? (
            <div className="text-muted-foreground px-6 py-12 text-center text-sm">
              Belum ada transaksi sales Finance yang cocok
              dengan filter.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Order source</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">
                    Nilai
                  </TableHead>
                  <TableHead className="text-right">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-muted-foreground text-sm">
                      {transaction.transaction_date
                        ? formatDate(
                            transaction.transaction_date
                          )
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/finance/sales/${transaction.id}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {transaction.source_order_number}
                      </Link>
                      <p className="text-muted-foreground mt-1 font-mono text-xs">
                        {transaction.source_order_id}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {transaction.platform}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={transaction.status}
                      />
                      {transaction.blocked_reason ? (
                        <p className="text-destructive mt-1 max-w-xs text-xs whitespace-normal">
                          {transaction.blocked_reason}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {transaction.sales_amount === null
                        ? '—'
                        : formatMoney(
                            transaction.sales_amount,
                            transaction.currency
                          )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {transaction.status ===
                        'pending' ? (
                          <Button
                            size="sm"
                            disabled={
                              workingId === transaction.id
                            }
                            onClick={() =>
                              postTransaction(
                                transaction.id,
                                'post'
                              )
                            }
                          >
                            {workingId === transaction.id
                              ? 'Memproses…'
                              : 'Post'}
                          </Button>
                        ) : null}
                        {transaction.status ===
                        'blocked' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={
                              workingId === transaction.id
                            }
                            onClick={() =>
                              postTransaction(
                                transaction.id,
                                'retry'
                              )
                            }
                          >
                            {workingId === transaction.id
                              ? 'Mencoba…'
                              : 'Coba lagi'}
                          </Button>
                        ) : null}
                        {transaction.journal_entry_id ? (
                          <Link
                            href={`/dashboard/finance/accounting/general-journal/${transaction.journal_entry_id}`}
                            className="text-primary px-2 py-1.5 text-xs font-medium underline-offset-4 hover:underline"
                          >
                            Journal
                          </Link>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Pagination query={query} data={data} />
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: 'pending' | 'blocked' | 'posted' | 'reversed';
}) {
  return (
    <Badge
      variant={
        status === 'posted'
          ? 'success'
          : status === 'blocked'
            ? 'destructive'
            : status === 'reversed'
              ? 'warning'
              : 'info'
      }
    >
      {status}
    </Badge>
  );
}

function Pagination({
  query,
  data,
}: {
  query: FinanceSalesTransactionListQueryDTO;
  data: FinanceSalesTransactionListResponseDTO;
}) {
  const createHref = (page: number) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(query.limit));
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    if (query.posting_mode)
      params.set('posting_mode', query.posting_mode);
    return `?${params.toString()}`;
  };
  const hasPrevious = data.pagination.page > 1;
  const hasNext =
    data.pagination.page < data.pagination.total_pages;

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-muted-foreground text-xs">
        Menampilkan {data.transactions.length} transaksi
        pada halaman ini.
      </p>
      <div className="flex gap-2">
        {hasPrevious ? (
          <Link
            href={createHref(data.pagination.page - 1)}
            className="border-border hover:bg-muted rounded-lg border px-3 py-1.5 text-xs font-medium"
          >
            Sebelumnya
          </Link>
        ) : (
          <span className="text-muted-foreground rounded-lg border px-3 py-1.5 text-xs opacity-50">
            Sebelumnya
          </span>
        )}
        {hasNext ? (
          <Link
            href={createHref(data.pagination.page + 1)}
            className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-xs font-medium"
          >
            Berikutnya
          </Link>
        ) : (
          <span className="text-muted-foreground rounded-lg border px-3 py-1.5 text-xs opacity-50">
            Berikutnya
          </span>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-muted-foreground text-xs font-medium uppercase">
          {label}
        </p>
        <p className="text-2xl font-semibold tracking-tight">
          {new Intl.NumberFormat('id-ID').format(value)}
        </p>
      </CardContent>
    </Card>
  );
}

const getErrorMessage = (payload: unknown) => {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'error' in payload
  ) {
    const error = (payload as { error?: unknown }).error;
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message ===
        'string'
    ) {
      return (error as { message: string }).message;
    }
  }

  return 'Aksi Finance gagal diproses.';
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
  }).format(new Date(value));

const formatMoney = (value: number, currency: string) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
