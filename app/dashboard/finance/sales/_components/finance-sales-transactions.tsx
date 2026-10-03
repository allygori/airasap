'use client';

import { formatMediumDate as formatDate } from '@/lib/date';
import { formatCurrency as formatMoney } from '@/lib/number/money';
import { formatNumber } from '@/lib/number';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';
import { HugeiconsIcon } from '@hugeicons/react';
import { MoreVerticalIcon } from '@hugeicons/core-free-icons';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FinanceSalesCogsRetryResultSchema,
  FinanceSalesWorkflowResultSchema,
  type FinanceSalesTransactionListQueryDTO,
  type FinanceSalesTransactionListResponseDTO,
} from '@/modules/finance/client';
import { FinanceSalesFilterForm } from './finance-sales-filter.form';

const ActionResponseSchema = z.object({
  success: z.literal(true),
  data: FinanceSalesWorkflowResultSchema,
});

const CogsRetryActionResponseSchema = z.object({
  success: z.literal(true),
  data: FinanceSalesCogsRetryResultSchema,
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
  const [notice, setNotice] = useState<string | null>(null);
  const [retriedCogsIds, setRetriedCogsIds] = useState<
    Set<string>
  >(() => new Set());

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

  const retryCogs = async (transactionId: string) => {
    setWorkingId(transactionId);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(
        `/api/v1/dashboard/finance/sales/${transactionId}/retry-cogs`,
        { method: 'POST' }
      );
      const payload: unknown = await response.json();

      if (!response.ok) {
        setError(getErrorMessage(payload));
        return;
      }

      const parsed =
        CogsRetryActionResponseSchema.safeParse(payload);
      if (!parsed.success) {
        setError('Respons server Finance tidak valid.');
        return;
      }

      if (parsed.data.data.status === 'deferred') {
        setError(
          parsed.data.data.reason ??
            'HPP masih tertunda karena stok belum siap.'
        );
      } else {
        setRetriedCogsIds(
          (current) => new Set([...current, transactionId])
        );
        setNotice('HPP berhasil dihitung dan diposting.');
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
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/finance/accounting/general-journal"
            className={buttonVariants({
              variant: 'outline',
            })}
          >
            Lihat General Journal
          </Link>
          <Link
            href="/dashboard/finance/sales/offline"
            className={buttonVariants()}
          >
            + Penjualan offline
          </Link>
        </div>
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
      {notice ? (
        <div
          role="status"
          className="border-success/30 bg-success/10 text-success rounded-lg border px-4 py-3 text-sm"
        >
          {notice}
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
          <FinanceSalesFilterForm
            key={`${query.search ?? ''}:${query.status ?? ''}:${query.posting_mode ?? ''}`}
            initialValues={{
              search: query.search ?? '',
              status: query.status ?? 'all',
              posting_mode: query.posting_mode ?? 'all',
            }}
          />
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
                  <TableHead>Sumber</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>HPP</TableHead>
                  <TableHead className="text-right">
                    Nilai
                  </TableHead>
                  <TableHead className="w-12 text-right">
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
                      {transaction.platform === 'offline'
                        ? 'Offline'
                        : transaction.platform}
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
                    <TableCell>
                      <InventoryCogsBadge
                        status={
                          transaction.inventory_cogs_status
                        }
                        totalCost={
                          transaction.inventory_cogs_total_cost
                        }
                        currency={transaction.currency}
                        reason={
                          transaction.inventory_cogs_deferred_reason
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {transaction.sales_amount === null
                        ? '—'
                        : formatMoney(
                            transaction.sales_amount,
                            transaction.currency
                          )}
                    </TableCell>
                    <TableCell className="w-12 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              className="text-muted-foreground data-[state=open]:bg-muted flex size-8"
                              size="icon"
                              aria-label={`Buka menu aksi ${transaction.source_order_number}`}
                            />
                          }
                        >
                          <HugeiconsIcon
                            icon={MoreVerticalIcon}
                            size={16}
                          />
                          <span className="sr-only">
                            Buka menu aksi
                          </span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-56"
                        >
                          {transaction.status ===
                          'pending' ? (
                            <DropdownMenuItem
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
                            </DropdownMenuItem>
                          ) : null}
                          {transaction.status ===
                          'blocked' ? (
                            <DropdownMenuItem
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
                            </DropdownMenuItem>
                          ) : null}
                          {transaction.status ===
                            'posted' &&
                          transaction.inventory_cogs_status ===
                            'deferred' &&
                          !retriedCogsIds.has(
                            transaction.id
                          ) ? (
                            <DropdownMenuItem
                              disabled={
                                workingId === transaction.id
                              }
                              onClick={() =>
                                retryCogs(transaction.id)
                              }
                            >
                              {workingId === transaction.id
                                ? 'Menghitung…'
                                : 'Coba hitung HPP'}
                            </DropdownMenuItem>
                          ) : null}
                          {transaction.journal_entry_id ? (
                            <DropdownMenuItem
                              render={
                                <Link
                                  href={`/dashboard/finance/accounting/general-journal?search=${encodeURIComponent(transaction.source_order_id)}`}
                                />
                              }
                            >
                              Jurnal terkait
                            </DropdownMenuItem>
                          ) : null}
                          {transaction.inventory_cogs_journal_entry_id ? (
                            <DropdownMenuItem
                              render={
                                <Link
                                  href={`/dashboard/finance/accounting/general-journal?search=${encodeURIComponent(transaction.source_order_id)}`}
                                />
                              }
                            >
                              Jurnal HPP
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
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

function InventoryCogsBadge({
  status,
  totalCost,
  currency,
  reason,
}: {
  status: 'deferred' | 'posted';
  totalCost: number | null;
  currency: string;
  reason: string | null;
}) {
  return (
    <div className="space-y-1">
      <Badge
        variant={
          status === 'posted' ? 'success' : 'warning'
        }
      >
        {status === 'posted' ? 'Posted' : 'Ditunda'}
      </Badge>
      {status === 'posted' && totalCost !== null ? (
        <p className="font-mono text-xs">
          {formatMoney(totalCost, currency)}
        </p>
      ) : reason ? (
        <p className="text-muted-foreground max-w-xs text-xs whitespace-normal">
          {reason}
        </p>
      ) : null}
    </div>
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
          {formatNumber(value, 3)}
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
