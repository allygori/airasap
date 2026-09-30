import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { formatMediumDate as formatDate } from '@/lib/date';
import { formatCurrency as formatMoney } from '@/lib/number/money';
import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';
import {
  FINANCE_DEFAULT_CALENDAR_TIMEZONE,
  assertFinanceModuleActive,
  FinanceDomainError,
  getFinanceCalendarDate,
  FinanceSalesTransactionReadService,
  type FinanceSalesTransactionDetailResponseDTO,
  type FinanceTenantContext,
} from '@/modules/finance';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
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
import { FinanceSaleFullReturnClient } from './_components/finance-sale-full-return.client';

type FinanceSalesDetailPageProps = {
  params: Promise<{ transactionId: string }>;
};

export default async function FinanceSalesDetailPage({
  params,
}: FinanceSalesDetailPageProps) {
  const tenantContext = await getTenantContext();
  if (!tenantContext.organizationId)
    return <UnavailableState />;

  const { transactionId } = await params;
  const data = await loadTransaction(
    tenantContext,
    transactionId
  );

  if (!data) notFound();

  const transaction = data.transaction;

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/dashboard/finance/sales"
            className="text-primary text-sm underline-offset-4 hover:underline"
          >
            ← Kembali ke penjualan
          </Link>
          <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
            Finance / Sales transaction
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight">
            {transaction.source_order_number}
          </h1>
        </div>
        <Badge
          variant={getStatusVariant(transaction.status)}
        >
          {transaction.status}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <InfoRow
              label="Source order ID"
              value={transaction.source_order_id}
              mono
            />
            <InfoRow
              label="Sumber"
              value={
                transaction.platform === 'offline'
                  ? 'Offline'
                  : transaction.platform
              }
            />
            <InfoRow
              label="Status source"
              value={transaction.source_status ?? '—'}
            />
            <InfoRow
              label="Mode posting"
              value={transaction.posting_mode}
            />
            <InfoRow
              label="Tanggal transaksi"
              value={
                transaction.transaction_date
                  ? formatDate(transaction.transaction_date)
                  : '—'
              }
            />
            <InfoRow
              label="Nilai sales"
              value={
                transaction.sales_amount === null
                  ? '—'
                  : formatMoney(
                      transaction.sales_amount,
                      transaction.currency
                    )
              }
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Traceability</CardTitle>
            <CardDescription>
              Finance menyimpan referensi source dan journal
              tanpa mengubah data order asli.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <InfoRow
              label="Transaction ID"
              value={transaction.id}
              mono
            />
            <InfoRow
              label="Idempotency"
              value={transaction.idempotency_key}
              mono
            />
            <InfoRow
              label="Journal entry"
              value={
                transaction.journal_entry_id ? (
                  <Link
                    href={`/dashboard/finance/accounting/general-journal/${transaction.journal_entry_id}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {transaction.journal_entry_id}
                  </Link>
                ) : (
                  'Belum ada journal'
                )
              }
              mono={Boolean(transaction.journal_entry_id)}
            />
            {transaction.blocked_reason ? (
              <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2">
                <p className="font-medium">
                  Alasan blocked
                </p>
                <p className="mt-1">
                  {transaction.blocked_reason}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {transaction.status === 'posted' &&
      transaction.journal_entry_id ? (
        <Card>
          <CardHeader>
            <CardTitle>Koreksi retur</CardTitle>
            <CardDescription>
              Jurnal posted tetap immutable. Koreksi membuat
              jurnal reversal baru dan mencatat pergerakan
              stok balik.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FinanceSaleFullReturnClient
              journalEntryId={transaction.journal_entry_id}
              initialDate={getFinanceCalendarDate(
                new Date(),
                FINANCE_DEFAULT_CALENDAR_TIMEZONE
              )}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Snapshot line order</CardTitle>
          <CardDescription>
            Snapshot ini hanya untuk audit dan traceability
            Finance.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {transaction.source_lines.length === 0 ? (
            <p className="text-muted-foreground px-6 py-8 text-sm">
              Tidak ada line item pada snapshot.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">
                    Qty final
                  </TableHead>
                  <TableHead className="text-right">
                    Subtotal
                  </TableHead>
                  <TableHead className="text-right">
                    HPP snapshot
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transaction.source_lines.map((line) => (
                  <TableRow key={line.source_line_id}>
                    <TableCell>
                      {line.product_name ??
                        line.product_id ??
                        'Produk tidak diketahui'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {line.child_sku ??
                        line.parent_sku ??
                        '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {line.final_quantity}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {line.subtotal === null
                        ? '—'
                        : formatMoney(
                            line.subtotal,
                            transaction.currency
                          )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {line.total_product_cost === null
                        ? 'Ditunda'
                        : formatMoney(
                            line.total_product_cost,
                            transaction.currency
                          )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div>
        <Link
          href="/dashboard/finance/sales"
          className={buttonVariants({ variant: 'outline' })}
        >
          Kembali
        </Link>
      </div>
    </div>
  );
}

async function loadTransaction(
  context: FinanceTenantContext,
  transactionId: string
): Promise<FinanceSalesTransactionDetailResponseDTO | null> {
  try {
    await db.connect();
    await assertFinanceModuleActive(context);
    return await new FinanceSalesTransactionReadService(
      context
    ).get(transactionId);
  } catch (error) {
    if (
      error instanceof FinanceDomainError &&
      (error.code === 'FINANCE_ORGANIZATION_NOT_FOUND' ||
        error.code ===
          'FINANCE_SALES_TRANSACTION_NOT_FOUND' ||
        error.code === 'FINANCE_NOT_ACTIVE')
    ) {
      return null;
    }
    throw error;
  }
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:items-start">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? 'font-mono text-xs' : ''}>
        {value}
      </dd>
    </div>
  );
}

function getStatusVariant(
  status: 'pending' | 'blocked' | 'posted' | 'reversed'
) {
  return status === 'posted'
    ? 'success'
    : status === 'blocked'
      ? 'destructive'
      : status === 'reversed'
        ? 'warning'
        : 'info';
}

function UnavailableState() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>
            Penjualan Finance tidak tersedia
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Organisasi aktif belum tersedia untuk membuka
          Finance.
        </CardContent>
      </Card>
    </div>
  );
}
