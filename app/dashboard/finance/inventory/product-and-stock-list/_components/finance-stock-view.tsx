import Link from 'next/link';
import { formatNumber } from '@/lib/number';
import { formatCurrency as formatMoney } from '@/lib/number/money';
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
import type {
  FinanceInventoryStockQueryDTO,
  FinanceInventoryStockResponseDTO,
} from '@/modules/finance';
import { FinanceStockFilterForm } from './finance-stock-filter.form';

export function FinanceStockView({
  data,
  query,
}: {
  data: FinanceInventoryStockResponseDTO;
  query: FinanceInventoryStockQueryDTO;
}) {
  const reviewCount = data.items.filter(
    (item) => item.status === 'needs_review'
  ).length;
  const trackedValue = data.items.reduce(
    (sum, item) => sum + (item.value_on_hand ?? 0),
    0
  );

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-3xl flex-col gap-2">
          <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
            Finance / Persediaan
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Produk & stok
          </h1>
          <p className="text-muted-foreground leading-7">
            Saldo kuantitas dan nilai dari inventory
            movement yang sudah posted. Item dengan data
            ambigu ditandai untuk review, bukan ditebak
            otomatis.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/finance/inventory/setup"
            className={buttonVariants({
              variant: 'outline',
            })}
          >
            Siapkan inventory
          </Link>
          <Link
            href="/dashboard/finance/accounting/general-journal"
            className="text-primary text-sm font-medium underline-offset-4 hover:underline"
          >
            Lihat journal →
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Item aktif"
          value={data.pagination.total}
        />
        <SummaryCard
          label="Perlu review"
          value={reviewCount}
        />
        <SummaryCard
          label="Nilai terpantau"
          value={trackedValue}
          money
        />
      </div>

      <Card>
        <CardHeader className="gap-4 border-b lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Saldo stok</CardTitle>
            <CardDescription>
              Sumber: {data.source.collection} dengan status{' '}
              {data.source.status}. Page{' '}
              {data.pagination.page} dari{' '}
              {data.pagination.total_pages || 1}.
            </CardDescription>
          </div>
          <FinanceStockFilterForm
            key={`${query.search ?? ''}:${query.item_type ?? ''}`}
            initialValues={{
              search: query.search ?? '',
              item_type: query.item_type ?? 'all',
            }}
          />
        </CardHeader>
        <CardContent className="p-0">
          {data.items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <p className="text-muted-foreground text-sm">
                Belum ada item inventory aktif yang cocok
                dengan filter.
              </p>
              <Link
                href="/dashboard/finance/inventory/setup"
                className={buttonVariants({
                  variant: 'secondary',
                })}
              >
                Siapkan inventory
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-right">
                    Qty on hand
                  </TableHead>
                  <TableHead className="text-right">
                    Dipesan
                  </TableHead>
                  <TableHead className="text-right">
                    Tersedia
                  </TableHead>
                  <TableHead className="text-right">
                    Nilai
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">
                    Mapping
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => (
                  <TableRow key={item.item_id}>
                    <TableCell>
                      <p className="font-medium">
                        {item.name}
                      </p>
                      <p className="text-muted-foreground mt-1 font-mono text-xs">
                        {item.sku} · {item.location_count}{' '}
                        lokasi
                      </p>
                      {item.reservation_issue_count > 0 ? (
                        <p className="text-destructive mt-1 text-xs">
                          {item.reservation_issue_count}{' '}
                          reservasi perlu ditinjau
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.item_type}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {item.quantity_on_hand === null
                        ? 'Tidak dilacak'
                        : `${formatNumber(item.quantity_on_hand, 2)} ${item.unit}`}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {item.reserved_quantity === null
                        ? 'Tidak dilacak'
                        : `${formatNumber(item.reserved_quantity, 2)} ${item.unit}`}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {item.sellable_quantity === null
                        ? 'Tidak dilacak'
                        : `${formatNumber(item.sellable_quantity, 2)} ${item.unit}`}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {item.value_on_hand === null
                        ? 'Tidak dilacak'
                        : formatMoney(item.value_on_hand)}
                      {item.average_unit_cost !== null ? (
                        <p className="text-muted-foreground mt-1 text-[0.68rem]">
                          ~{' '}
                          {formatMoney(
                            item.average_unit_cost
                          )}
                          /{item.unit}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <StockStatusBadge
                        status={item.status}
                      />
                      {item.unresolved_movement_count > 0 ||
                      item.missing_cost_movement_count >
                        0 ? (
                        <p className="text-muted-foreground mt-1 text-xs">
                          {item.unresolved_movement_count >
                          0
                            ? `${item.unresolved_movement_count} movement ambigu`
                            : `${item.missing_cost_movement_count} movement tanpa cost`}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {item.mapping_count}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs">
        {data.source.costing_note}
      </p>

      <Pagination query={query} data={data} />
    </div>
  );
}
function StockStatusBadge({
  status,
}: {
  status:
    | 'ready'
    | 'needs_review'
    | 'quantity_not_tracked'
    | 'value_not_tracked';
}) {
  const label = {
    ready: 'Ready',
    needs_review: 'Perlu review',
    quantity_not_tracked: 'Qty tidak dilacak',
    value_not_tracked: 'Nilai tidak dilacak',
  }[status];

  return (
    <Badge
      variant={
        status === 'ready'
          ? 'success'
          : status === 'needs_review'
            ? 'warning'
            : 'secondary'
      }
    >
      {label}
    </Badge>
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
      <CardContent className="flex flex-col gap-1 p-4">
        <p className="text-muted-foreground text-xs font-medium uppercase">
          {label}
        </p>
        <p className="text-2xl font-semibold tracking-tight">
          {money
            ? formatMoney(value)
            : formatNumber(value, 2)}
        </p>
      </CardContent>
    </Card>
  );
}

function Pagination({
  query,
  data,
}: {
  query: FinanceInventoryStockQueryDTO;
  data: FinanceInventoryStockResponseDTO;
}) {
  const createHref = (page: number) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(query.limit));
    if (query.search) params.set('search', query.search);
    if (query.item_type)
      params.set('item_type', query.item_type);
    if (query.location_id)
      params.set('location_id', query.location_id);
    return `?${params.toString()}`;
  };
  const hasPrevious = data.pagination.page > 1;
  const hasNext =
    data.pagination.page < data.pagination.total_pages;

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-muted-foreground text-xs">
        Menampilkan {data.items.length} item pada halaman
        ini.
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
