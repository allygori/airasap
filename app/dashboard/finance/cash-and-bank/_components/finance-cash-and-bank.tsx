import Link from 'next/link';
import {
  FINANCE_CASH_BANK_SUBTYPE_LABELS,
  type FinanceCashBankAccountDTO,
  type FinanceCashBankQueryDTO,
  type FinanceCashBankResponseDTO,
} from '@/modules/finance';
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

type FinanceCashAndBankProps = {
  data: FinanceCashBankResponseDTO;
  query: FinanceCashBankQueryDTO;
};

export function FinanceCashAndBank({
  data,
  query,
}: FinanceCashAndBankProps) {
  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="bg-card relative overflow-hidden rounded-2xl border p-6 shadow-sm md:p-8">
        <div className="bg-primary/10 pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-primary text-xs font-bold tracking-[0.22em] uppercase">
              Finance / Keuangan
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
              Cash & Bank
            </h1>
            <p className="text-muted-foreground max-w-xl leading-7">
              Satu pandangan untuk kas toko, rekening bank,
              e-wallet, dan saldo marketplace. Saldo
              dihitung dari journal Finance yang sudah
              posted.
            </p>
          </div>
          <Link
            href="/dashboard/finance/accounting/chart-of-accounts"
            className={ButtonLinkClass}
          >
            Kelola Chart of Accounts →
          </Link>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard
          label="Total saldo"
          value={formatMoney(data.meta.total_balance)}
          detail="Kas, bank, e-wallet, dan marketplace"
          accent="primary"
        />
        <SummaryCard
          label="Akun aktif"
          value={String(data.meta.total_accounts)}
          detail={`${data.meta.accounts_with_activity} sudah memiliki aktivitas journal`}
          accent="amber"
        />
        <SummaryCard
          label="Sumber saldo"
          value="Journal posted"
          detail="Journal reversed tidak dihitung ulang"
          accent="slate"
        />
      </div>

      <Card>
        <CardHeader className="gap-4 border-b lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Rekening dan saldo</CardTitle>
            <CardDescription>
              Opening balance ditampilkan terpisah agar
              titik awal bisnis mudah ditelusuri.
            </CardDescription>
          </div>
          <form
            method="get"
            className="flex w-full gap-2 sm:w-auto"
          >
            <label
              className="sr-only"
              htmlFor="cash-bank-search"
            >
              Cari akun
            </label>
            <input
              id="cash-bank-search"
              name="search"
              type="search"
              placeholder="Cari nama atau kode akun"
              defaultValue={query.search ?? ''}
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-9 min-w-0 flex-1 rounded-lg border px-3 text-sm outline-none focus-visible:ring-3 sm:w-64"
            />
            <Button type="submit" variant="secondary">
              Cari
            </Button>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          {data.accounts.length === 0 ? (
            <div className="text-muted-foreground px-6 py-12 text-center text-sm">
              Belum ada akun Cash & Bank yang cocok. Buat
              atau aktifkan akun postable di Chart of
              Accounts.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Akun</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Opening balance</TableHead>
                  <TableHead>Aktivitas terakhir</TableHead>
                  <TableHead className="text-right">
                    Saldo saat ini
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.accounts.map((account) => (
                  <CashBankRow
                    key={account.id}
                    account={account}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs">
        Rekonsiliasi bank dan import mutasi belum termasuk
        dalam phase ini.
      </p>
    </div>
  );
}

function CashBankRow({
  account,
}: {
  account: FinanceCashBankAccountDTO;
}) {
  const metadata = [
    account.account_metadata.institution,
    account.account_metadata.account_last4
      ? `•••• ${account.account_metadata.account_last4}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{account.name}</div>
        <div className="text-muted-foreground mt-1 font-mono text-xs">
          {account.code}
          {metadata ? ` · ${metadata}` : ''}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {
            FINANCE_CASH_BANK_SUBTYPE_LABELS[
              account.subtype
            ]
          }
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-xs">
        {formatMoney(account.opening_balance)}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {account.last_transaction_date
          ? formatDate(account.last_transaction_date)
          : 'Belum ada journal'}
      </TableCell>
      <TableCell className="text-right font-mono text-sm font-semibold">
        <span
          className={
            account.current_balance < 0
              ? 'text-destructive'
              : undefined
          }
        >
          {formatMoney(account.current_balance)}
        </span>
      </TableCell>
    </TableRow>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  accent: 'primary' | 'amber' | 'slate';
}) {
  const accentClass = {
    primary: 'border-l-primary',
    amber: 'border-l-amber-500',
    slate: 'border-l-slate-400',
  }[accent];

  return (
    <Card className={`border-l-4 ${accentClass}`}>
      <CardContent className="space-y-2 p-4">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {label}
        </p>
        <p className="text-2xl font-semibold tracking-tight">
          {value}
        </p>
        <p className="text-muted-foreground text-xs">
          {detail}
        </p>
      </CardContent>
    </Card>
  );
}

const ButtonLinkClass =
  'border-primary/30 text-primary hover:bg-primary/5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors';

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
