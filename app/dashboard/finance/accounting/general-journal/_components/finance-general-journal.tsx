import Link from 'next/link';
import { formatMediumDate as formatDate } from '@/lib/date';
import { formatCurrency as formatMoney } from '@/lib/number/money';
import { formatNumber } from '@/lib/number';
import { Badge } from '@/components/ui/badge';
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
  FinanceJournalListQueryDTO,
  FinanceJournalListResponseDTO,
} from '@/modules/finance';
import { GeneralJournalFilterForm } from './general-journal-filter.form';

export function FinanceGeneralJournal({
  data,
  query,
}: {
  data: FinanceJournalListResponseDTO;
  query: FinanceJournalListQueryDTO;
}) {
  const totalDebit = data.entries.reduce(
    (sum, entry) => sum + entry.total_debit,
    0
  );
  const totalCredit = data.entries.reduce(
    (sum, entry) => sum + entry.total_credit,
    0
  );

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
            Finance / Accounting
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight">
            General Journal
          </h1>
          <p className="text-muted-foreground leading-7">
            Jejak transaksi Finance yang sudah diposting,
            sumbernya, dan total debit-kreditnya.
          </p>
        </div>
        <Link
          href="/dashboard/finance/accounting/chart-of-accounts"
          className="text-primary text-sm font-medium underline-offset-4 hover:underline"
        >
          Lihat Chart of Accounts →
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Journal ditemukan"
          value={data.pagination.total}
        />
        <SummaryCard
          label="Debit halaman ini"
          value={totalDebit}
          money
        />
        <SummaryCard
          label="Credit halaman ini"
          value={totalCredit}
          money
        />
      </div>

      <Card>
        <CardHeader className="gap-4 border-b lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Daftar posting</CardTitle>
            <CardDescription>
              Page {data.pagination.page} dari{' '}
              {data.pagination.total_pages || 1}
            </CardDescription>
          </div>
          <GeneralJournalFilterForm
            key={`${query.search ?? ''}:${query.period ?? ''}:${query.period_to ?? ''}:${query.account_id ?? ''}:${query.source_type ?? ''}:${query.status ?? ''}`}
            initialValues={{
              search: query.search ?? '',
              period: query.period ?? '',
              period_to: query.period_to ?? '',
              account_id: query.account_id ?? '',
              source_type: query.source_type ?? '',
              status: query.status ?? 'all',
            }}
          />
        </CardHeader>
        <CardContent className="p-0">
          {data.entries.length === 0 ? (
            <div className="text-muted-foreground px-6 py-12 text-center text-sm">
              Belum ada journal yang cocok dengan filter.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Journal</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">
                    Debit
                  </TableHead>
                  <TableHead className="text-right">
                    Credit
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(entry.transaction_date)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/finance/accounting/general-journal/${entry.id}`}
                        className="font-mono text-xs font-semibold underline-offset-4 hover:underline"
                      >
                        {entry.entry_number}
                      </Link>
                      <p className="text-muted-foreground mt-1 max-w-xs truncate text-xs">
                        {entry.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="grid gap-1 text-xs">
                        <span className="font-medium">
                          {entry.source_type}
                        </span>
                        <span className="text-muted-foreground font-mono">
                          {entry.source_id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          entry.status === 'posted'
                            ? 'success'
                            : 'warning'
                        }
                      >
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatMoney(
                        entry.total_debit,
                        entry.currency
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatMoney(
                        entry.total_credit,
                        entry.currency
                      )}
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

function Pagination({
  query,
  data,
}: {
  query: FinanceJournalListQueryDTO;
  data: FinanceJournalListResponseDTO;
}) {
  const createHref = (page: number) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(query.limit));
    if (query.period) params.set('period', query.period);
    if (query.period_to)
      params.set('period_to', query.period_to);
    if (query.account_id)
      params.set('account_id', query.account_id);
    if (query.source_type)
      params.set('source_type', query.source_type);
    if (query.status) params.set('status', query.status);
    if (query.search) params.set('search', query.search);
    return `?${params.toString()}`;
  };
  const hasPrevious = data.pagination.page > 1;
  const hasNext =
    data.pagination.page < data.pagination.total_pages;

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-muted-foreground text-xs">
        Menampilkan {data.entries.length} journal pada
        halaman ini.
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
  money = false,
}: {
  label: string;
  value: number;
  money?: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-muted-foreground text-xs font-medium uppercase">
          {label}
        </p>
        <p className="text-2xl font-semibold tracking-tight">
          {money
            ? formatMoney(value)
            : formatNumber(value, 3)}
        </p>
      </CardContent>
    </Card>
  );
}
