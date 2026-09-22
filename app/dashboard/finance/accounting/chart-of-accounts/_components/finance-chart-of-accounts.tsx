import Link from 'next/link';
import {
  Badge,
  badgeVariants,
} from '@/components/ui/badge';
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
import type {
  FinanceAccountDTO,
  FinanceAccountFilterDTO,
  FinanceAccountListResponseDTO,
  FinanceAccountType,
} from '@/modules/finance';

const ACCOUNT_TYPE_LABELS: Record<
  FinanceAccountType,
  string
> = {
  asset: 'Aset',
  liability: 'Liabilitas',
  equity: 'Ekuitas',
  revenue: 'Pendapatan',
  cost_of_sales: 'HPP',
  expense: 'Beban',
  other_income: 'Pendapatan lain',
  other_expense: 'Beban lain',
};

export function FinanceChartOfAccounts({
  data,
  filters,
}: {
  data: FinanceAccountListResponseDTO;
  filters: FinanceAccountFilterDTO;
}) {
  const selectableCount = data.accounts.filter(
    (account) => account.is_selectable
  ).length;
  const inactiveCount = data.accounts.filter(
    (account) => !account.is_active
  ).length;

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
            Finance / Accounting
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Chart of Accounts
          </h1>
          <p className="text-muted-foreground leading-7">
            Struktur akun yang menjadi dasar pemetaan
            transaksi dan laporan Finance. Akun posted hanya
            boleh memakai akun aktif yang dapat diposting.
          </p>
        </div>
        <Link
          href="/dashboard/finance"
          className={buttonVariants({ variant: 'outline' })}
        >
          Kembali ke Finance
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Akun ditampilkan"
          value={data.meta.total}
        />
        <SummaryCard
          label="Dapat diposting"
          value={selectableCount}
        />
        <SummaryCard
          label="Nonaktif"
          value={inactiveCount}
        />
      </div>

      <Card>
        <CardHeader className="gap-4 border-b sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Struktur akun</CardTitle>
            <CardDescription>
              Hierarchy dipertahankan dari COA yang sudah
              tersimpan.
            </CardDescription>
          </div>
          <form
            method="get"
            className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end"
          >
            <label className="grid gap-1 text-xs font-medium">
              Cari akun
              <input
                name="search"
                type="search"
                placeholder="Kode atau nama"
                className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3 sm:w-48"
                defaultValue={filters.search ?? ''}
              />
            </label>
            <label className="grid gap-1 text-xs font-medium">
              Jenis akun
              <select
                name="type"
                defaultValue={filters.type ?? ''}
                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"
              >
                <option value="">Semua jenis</option>
                {Object.entries(ACCOUNT_TYPE_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>
            </label>
            <Button type="submit" variant="secondary">
              Terapkan
            </Button>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          {data.accounts.length === 0 ? (
            <div className="text-muted-foreground px-6 py-12 text-center text-sm">
              Tidak ada akun yang cocok dengan filter.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">
                    Kode
                  </TableHead>
                  <TableHead>Nama akun</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Saldo normal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">
                    Posting
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.accounts.map((account) => (
                  <AccountRow
                    key={account.id}
                    account={account}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AccountRow({
  account,
}: {
  account: FinanceAccountDTO;
}) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs font-medium">
        {account.code}
      </TableCell>
      <TableCell>
        <div
          className="flex items-center gap-2"
          style={{
            paddingLeft: `${Math.min(account.depth, 8) * 1.25}rem`,
          }}
        >
          <span
            aria-hidden="true"
            className="bg-border h-5 w-px shrink-0"
          />
          <div className="grid gap-0.5">
            <span className="font-medium">
              {account.name}
            </span>
            {account.subtype && (
              <span className="text-muted-foreground text-xs">
                {account.subtype}
              </span>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {ACCOUNT_TYPE_LABELS[account.type]}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm capitalize">
        {account.normal_balance}
      </TableCell>
      <TableCell>
        {account.is_active ? (
          <Badge variant="success">Aktif</Badge>
        ) : (
          <Badge variant="warning">Nonaktif</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <span
          className={badgeVariants({
            variant: account.is_selectable
              ? 'success'
              : 'ghost',
          })}
        >
          {account.is_selectable
            ? 'Bisa diposting'
            : 'Grup / terkunci'}
        </span>
      </TableCell>
    </TableRow>
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
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
