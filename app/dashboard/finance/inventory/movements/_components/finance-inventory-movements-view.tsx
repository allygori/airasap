import Link from 'next/link';
import { formatIDR as formatMoney } from '@/lib/number/money';
import { formatNumber } from '@/lib/number';
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
  FinanceInventoryMovementListQueryDTO,
  FinanceInventoryMovementListResponseDTO,
  FinanceInventoryMovementTypeDTO,
} from '@/modules/finance';
import { FinanceInventoryMovementFilterForm } from './finance-inventory-movement-filter.form';

const movementLabels: Record<
  FinanceInventoryMovementTypeDTO,
  string
> = {
  purchase: 'Pembelian',
  sale: 'Penjualan',
  return: 'Retur',
  damage: 'Barang rusak',
  loss: 'Kehilangan',
  adjustment: 'Penyesuaian stok',
  transfer_in: 'Transfer masuk',
  transfer_out: 'Transfer keluar',
  consumption: 'Pemakaian',
  opening_balance: 'Saldo awal',
};

const sourceLabels: Record<string, string> = {
  opening_balance: 'Saldo awal Finance',
  finance_purchase: 'Pembelian Finance',
  finance_inventory_adjustment: 'Penyesuaian stok',
  inventory_adjustment: 'Jurnal penyesuaian',
  order: 'Order',
  offline_sale: 'Penjualan offline',
  journal_reversal: 'Pembalikan jurnal',
  cash_bank_transfer: 'Transfer Kas & Bank',
  marketplace_release: 'Pencairan marketplace',
};

export function FinanceInventoryMovementsView({
  data,
  query,
}: {
  data: FinanceInventoryMovementListResponseDTO;
  query: FinanceInventoryMovementListQueryDTO;
}) {
  const pageValue = data.items.reduce(
    (total, movement) =>
      total +
      (movement.status === 'posted'
        ? (movement.total_cost ?? 0)
        : 0),
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
            Riwayat mutasi stok
          </h1>
          <p className="text-muted-foreground leading-7">
            Jejak barang masuk dan keluar per item. Hanya
            mutasi berstatus posted yang membentuk saldo
            stok.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/finance/inventory/product-and-stock-list"
            className={buttonVariants({
              variant: 'outline',
            })}
          >
            Lihat saldo stok
          </Link>
          <Link
            href="/dashboard/finance/inventory/stock-adjustments"
            className={buttonVariants({
              variant: 'default',
            })}
          >
            Catat penyesuaian
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryCard
          label="Mutasi ditemukan"
          value={data.pagination.total}
        />
        <SummaryCard
          label="Nilai mutasi posted di halaman ini"
          value={pageValue}
          money
        />
      </div>

      <Card>
        <CardHeader className="gap-4 border-b">
          <div>
            <CardTitle>Daftar mutasi</CardTitle>
            <CardDescription>
              Halaman {data.pagination.page} dari{' '}
              {data.pagination.total_pages || 1}. Status
              awal difilter ke posted; gunakan filter untuk
              melihat draft atau void.
            </CardDescription>
          </div>
          <FinanceInventoryMovementFilterForm
            key={`${query.search ?? ''}:${query.movement_type}:${query.status}`}
            initialValues={{
              search: query.search ?? '',
              movement_type: query.movement_type,
              status: query.status,
            }}
          />
        </CardHeader>
        <CardContent className="p-0">
          {data.items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <p className="font-medium">
                Belum ada mutasi yang cocok
              </p>
              <p className="text-muted-foreground max-w-md text-sm">
                Mutasi akan muncul di sini setelah ada saldo
                awal, pembelian, penjualan, atau penyesuaian
                stok yang tercatat.
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                <Link
                  href="/dashboard/finance/inventory/setup"
                  className={buttonVariants({
                    variant: 'outline',
                  })}
                >
                  Setup inventory
                </Link>
                <Link
                  href="/dashboard/finance/inventory/stock-adjustments"
                  className={buttonVariants({
                    variant: 'secondary',
                  })}
                >
                  Catat stok
                </Link>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Jenis / status</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead className="text-right">
                    Kuantitas
                  </TableHead>
                  <TableHead className="text-right">
                    Nilai
                  </TableHead>
                  <TableHead>Sumber / referensi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="whitespace-nowrap">
                      <p className="font-medium">
                        {formatDate(movement.occurred_at)}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {formatTime(movement.occurred_at)}
                      </p>
                    </TableCell>
                    <TableCell className="min-w-48">
                      <p className="font-medium">
                        {movement.item_name ??
                          'Item tidak ditemukan'}
                      </p>
                      <p className="text-muted-foreground mt-1 font-mono text-xs">
                        {movement.sku ??
                          movement.inventory_item_id}
                      </p>
                    </TableCell>
                    <TableCell className="min-w-36">
                      <p className="mb-1.5 font-medium">
                        {getMovementLabel(movement)}
                      </p>
                      <StatusBadge
                        status={movement.status}
                      />
                    </TableCell>
                    <TableCell>
                      {movement.location_name ??
                        'Lokasi tidak ditemukan'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatQuantity(movement)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {movement.total_cost === null
                        ? '—'
                        : formatMoney(movement.total_cost)}
                      {movement.unit_cost !== null ? (
                        <p className="text-muted-foreground mt-1 text-xs">
                          {formatMoney(movement.unit_cost)}{' '}
                          / unit
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="min-w-52">
                      <p className="font-medium">
                        {movement.source_type
                          ? (sourceLabels[
                              movement.source_type
                            ] ?? movement.source_type)
                          : '—'}
                      </p>
                      {movement.reference ? (
                        <p className="mt-1 text-sm break-words">
                          {movement.reference}
                        </p>
                      ) : null}
                      {movement.notes ? (
                        <p className="text-muted-foreground mt-1 max-w-xs text-xs break-words">
                          {movement.notes}
                        </p>
                      ) : null}
                      {movement.journal_entry_id &&
                      movement.source_id ? (
                        <Link
                          href={`/dashboard/finance/accounting/general-journal?search=${encodeURIComponent(movement.source_id)}`}
                          className="text-primary mt-1 inline-block text-xs underline-offset-4 hover:underline"
                        >
                          Lihat jurnal
                        </Link>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Pagination data={data} query={query} />
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

function StatusBadge({
  status,
}: {
  status: 'draft' | 'posted' | 'voided';
}) {
  return (
    <Badge
      variant={
        status === 'posted'
          ? 'success'
          : status === 'draft'
            ? 'warning'
            : 'secondary'
      }
    >
      {status === 'voided'
        ? 'Void'
        : status === 'posted'
          ? 'Posted'
          : 'Draft'}
    </Badge>
  );
}

function getMovementLabel(
  movement: FinanceInventoryMovementListResponseDTO['items'][number]
) {
  if (movement.movement_type !== 'adjustment') {
    return movementLabels[movement.movement_type];
  }
  if (movement.adjustment_direction === 'increase') {
    return 'Penyesuaian · stok bertambah';
  }
  if (movement.adjustment_direction === 'decrease') {
    return 'Penyesuaian · stok berkurang';
  }
  return movementLabels.adjustment;
}

function formatQuantity(
  movement: FinanceInventoryMovementListResponseDTO['items'][number]
) {
  const inbound =
    movement.movement_type === 'purchase' ||
    movement.movement_type === 'return' ||
    movement.movement_type === 'transfer_in' ||
    movement.movement_type === 'opening_balance' ||
    (movement.movement_type === 'adjustment' &&
      movement.adjustment_direction === 'increase');
  const outbound =
    movement.movement_type === 'sale' ||
    movement.movement_type === 'damage' ||
    movement.movement_type === 'loss' ||
    movement.movement_type === 'transfer_out' ||
    movement.movement_type === 'consumption' ||
    (movement.movement_type === 'adjustment' &&
      movement.adjustment_direction === 'decrease');
  const sign = inbound ? '+' : outbound ? '−' : '';
  return `${sign}${formatNumber(movement.quantity, 2)}${movement.unit ? ` ${movement.unit}` : ''}`;
}

function Pagination({
  data,
  query,
}: {
  data: FinanceInventoryMovementListResponseDTO;
  query: FinanceInventoryMovementListQueryDTO;
}) {
  const createHref = (page: number) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(query.limit));
    if (query.search) params.set('search', query.search);
    if (query.movement_type !== 'all') {
      params.set('movement_type', query.movement_type);
    }
    if (query.status !== 'posted')
      params.set('status', query.status);
    return `?${params.toString()}`;
  };
  const hasPrevious = data.pagination.page > 1;
  const hasNext =
    data.pagination.page < data.pagination.total_pages;

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-muted-foreground text-xs">
        Menampilkan {data.items.length} dari{' '}
        {formatNumber(data.pagination.total, 2)} mutasi pada
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

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value));

const formatTime = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value));
