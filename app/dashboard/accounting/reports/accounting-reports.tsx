'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BookOpenText,
  Boxes,
  CircleDollarSign,
  LoaderCircle,
  RefreshCw,
  Scale,
  WalletCards,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { formatIDR } from '@/lib/formatter/format-idr';

type AccountBalance = {
  account_id: string;
  code: string;
  name: string;
  type: string;
  subtype: string | null;
  normal_balance: 'debit' | 'credit';
  debit: number;
  credit: number;
  balance: number;
};

type AccountingReport = {
  period: { key: string; from: string; to: string };
  summary: {
    revenue: number;
    cost_of_sales: number;
    operating_expenses: number;
    total_expenses: number;
    net_income: number;
    cash_inflow: number;
    cash_outflow: number;
    cash_movement: number;
    inventory_value: number;
    receivable_balance: number;
  };
  profit_and_loss: {
    revenue: AccountBalance[];
    cost_of_sales: AccountBalance[];
    expenses: AccountBalance[];
  };
  trial_balance: AccountBalance[];
  cash_accounts: AccountBalance[];
  inventory: Array<{
    inventory_item_id: string;
    sku: string;
    name: string;
    unit: string;
    quantity: number;
    value: number;
  }>;
  journal_activity: Array<{
    id: string;
    entry_number: string;
    transaction_date: string;
    description: string;
    source_type: string | null;
    status: string;
    amount: number;
  }>;
  settlements: {
    posted_count: number;
    blocked_count: number;
    exception_count: number;
    gross_amount: number;
    fee_amount: number;
    net_amount: number;
    reconciliation_difference: number;
  };
};

type ApiPayload<T> = {
  success: boolean;
  data?: T;
  error?: { message?: string };
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

const getCurrentPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const reportChartConfig = {
  revenue: { label: 'Pendapatan', color: 'var(--chart-1)' },
  expenses: {
    label: 'Beban + HPP',
    color: 'var(--chart-2)',
  },
  net: { label: 'Laba bersih', color: 'var(--chart-3)' },
} as const;

export default function AccountingReports() {
  const [period, setPeriod] = useState(getCurrentPeriod);
  const [report, setReport] =
    useState<AccountingReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async (selectedPeriod = period) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/v1/dashboard/accounting/reports?period=${encodeURIComponent(selectedPeriod)}`,
        { cache: 'no-store' }
      );
      const payload =
        (await response.json()) as ApiPayload<AccountingReport>;
      if (
        !response.ok ||
        !payload.success ||
        !payload.data
      ) {
        throw new Error(
          payload.error?.message ||
            'Gagal memuat laporan accounting.'
        );
      }
      setReport(payload.data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Gagal memuat laporan accounting.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // The report is intentionally loaded from the tenant-scoped reporting endpoint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chartData = useMemo(
    () =>
      report
        ? [
            {
              label: 'Periode berjalan',
              revenue: report.summary.revenue,
              expenses: report.summary.total_expenses,
              net: report.summary.net_income,
            },
          ]
        : [],
    [report]
  );

  if (isLoading && !report) {
    return <ReportsSkeleton />;
  }

  return (
    <main className="flex min-h-full flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-2">
          <Badge
            variant="outline"
            className="w-fit gap-1.5 tracking-[0.18em] uppercase"
          >
            <Scale data-icon="inline-start" /> Financial
            cockpit
          </Badge>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Laporan accounting
            </h1>
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-6">
              Satu tampilan untuk membaca profit, arus kas,
              inventory, settlement, dan jejak journal yang
              sudah diposting.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="text-muted-foreground flex flex-col gap-1 text-xs font-medium">
            Periode laporan
            <Input
              type="month"
              value={period}
              onChange={(event) =>
                setPeriod(event.target.value)
              }
              className="w-full sm:w-40"
              aria-label="Periode laporan"
            />
          </label>
          <Button
            variant="outline"
            onClick={() => void loadReport(period)}
            disabled={isLoading}
          >
            {isLoading ? (
              <LoaderCircle
                className="animate-spin"
                data-icon="inline-start"
              />
            ) : (
              <RefreshCw data-icon="inline-start" />
            )}
            Refresh
          </Button>
        </div>
      </header>

      {error ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Reporting belum tersedia</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {report ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              icon={ArrowUpRight}
              label="Pendapatan"
              value={formatIDR(report.summary.revenue)}
              hint="Revenue posted"
              tone="positive"
            />
            <MetricCard
              icon={ArrowDownRight}
              label="Total biaya"
              value={formatIDR(
                report.summary.total_expenses
              )}
              hint="HPP + operasional"
            />
            <MetricCard
              icon={CircleDollarSign}
              label="Laba bersih"
              value={formatIDR(report.summary.net_income)}
              hint={
                report.summary.net_income >= 0
                  ? 'Positif'
                  : 'Perlu perhatian'
              }
              tone={
                report.summary.net_income >= 0
                  ? 'positive'
                  : 'negative'
              }
            />
            <MetricCard
              icon={WalletCards}
              label="Perubahan kas"
              value={formatIDR(
                report.summary.cash_movement
              )}
              hint={`Masuk ${formatIDR(report.summary.cash_inflow)}`}
              tone={
                report.summary.cash_movement >= 0
                  ? 'positive'
                  : 'negative'
              }
            />
            <MetricCard
              icon={Boxes}
              label="Nilai inventory"
              value={formatIDR(
                report.summary.inventory_value
              )}
              hint={`${report.inventory.length} item aktif`}
            />
          </section>

          {report.settlements.blocked_count > 0 ||
          report.settlements.exception_count > 0 ? (
            <Alert>
              <AlertTriangle />
              <AlertTitle>
                Ada settlement yang perlu direkonsiliasi
              </AlertTitle>
              <AlertDescription>
                {report.settlements.blocked_count} blocked
                dan {report.settlements.exception_count}{' '}
                exception pada periode ini. Selisih tercatat
                sebesar{' '}
                {formatIDR(
                  report.settlements
                    .reconciliation_difference
                )}
                .
              </AlertDescription>
            </Alert>
          ) : null}

          <Tabs defaultValue="overview" className="gap-5">
            <TabsList className="w-full justify-start overflow-x-auto sm:w-fit">
              <TabsTrigger value="overview">
                Overview
              </TabsTrigger>
              <TabsTrigger value="trial-balance">
                Trial balance
              </TabsTrigger>
              <TabsTrigger value="inventory">
                Inventory
              </TabsTrigger>
              <TabsTrigger value="journal">
                Journal activity
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="overview"
              className="flex flex-col gap-4"
            >
              <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Profit and loss</CardTitle>
                    <CardDescription>
                      {formatDate(report.period.from)} —{' '}
                      {formatDate(report.period.to)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={reportChartConfig}
                      className="h-72 w-full"
                    >
                      <BarChart
                        accessibilityLayer
                        data={chartData}
                        margin={{ left: 8, right: 8 }}
                      >
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) =>
                            `${Math.round(Number(value) / 1000000)} jt`
                          }
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value) =>
                                formatIDR(Number(value))
                              }
                            />
                          }
                        />
                        <Bar
                          dataKey="revenue"
                          fill="var(--color-revenue)"
                          radius={4}
                        />
                        <Bar
                          dataKey="expenses"
                          fill="var(--color-expenses)"
                          radius={4}
                        />
                        <Bar
                          dataKey="net"
                          fill="var(--color-net)"
                          radius={4}
                        />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ringkasan P&L</CardTitle>
                    <CardDescription>
                      Saldo dari journal posted pada periode
                      terpilih.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <SummaryLine
                      label="Pendapatan"
                      value={report.summary.revenue}
                    />
                    <SummaryLine
                      label="HPP"
                      value={report.summary.cost_of_sales}
                    />
                    <SummaryLine
                      label="Beban operasional"
                      value={
                        report.summary.operating_expenses
                      }
                    />
                    <Separator />
                    <SummaryLine
                      label="Laba bersih"
                      value={report.summary.net_income}
                      strong
                    />
                    <div className="bg-muted/50 flex items-center justify-between rounded-lg px-3 py-2 text-sm">
                      <span className="text-muted-foreground">
                        Piutang marketplace
                      </span>
                      <span className="font-medium">
                        {formatIDR(
                          report.summary.receivable_balance
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <CashCard report={report} />
                <SettlementCard report={report} />
              </div>
            </TabsContent>

            <TabsContent value="trial-balance">
              <DataCard
                title="Trial balance"
                description="Akun postable dengan aktivitas debit dan credit pada periode terpilih."
              >
                <TrialBalanceTable
                  rows={report.trial_balance}
                />
              </DataCard>
            </TabsContent>

            <TabsContent value="inventory">
              <DataCard
                title="Inventory valuation"
                description="Snapshot quantity dan nilai inventory dari seluruh movement posted sampai akhir periode."
              >
                <InventoryTable rows={report.inventory} />
              </DataCard>
            </TabsContent>

            <TabsContent value="journal">
              <DataCard
                title="Journal activity"
                description="Journal entry terbaru yang menjadi sumber laporan periode ini."
              >
                <JournalTable
                  rows={report.journal_activity}
                />
              </DataCard>
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof ArrowUpRight;
  label: string;
  value: string;
  hint: string;
  tone?: 'positive' | 'negative';
}) {
  return (
    <Card>
      <CardContent className="flex min-h-32 flex-col justify-between gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground text-sm">
            {label}
          </span>
          <Icon
            className="text-muted-foreground size-4"
            data-icon="inline-end"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span
            className={`text-xl font-semibold tracking-tight ${tone === 'positive' ? 'text-emerald-600 dark:text-emerald-400' : tone === 'negative' ? 'text-destructive' : ''}`}
          >
            {value}
          </span>
          <span className="text-muted-foreground text-xs">
            {hint}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryLine({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${strong ? 'text-base font-semibold' : 'text-sm'}`}
    >
      <span
        className={strong ? '' : 'text-muted-foreground'}
      >
        {label}
      </span>
      <span>{formatIDR(value)}</span>
    </div>
  );
}

function CashCard({
  report,
}: {
  report: AccountingReport;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash movement</CardTitle>
        <CardDescription>
          Mutasi account kas, bank, e-wallet, dan saldo
          marketplace.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-muted-foreground text-xs">
              Inflow
            </p>
            <p className="mt-1 font-semibold">
              {formatIDR(report.summary.cash_inflow)}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-muted-foreground text-xs">
              Outflow
            </p>
            <p className="mt-1 font-semibold">
              {formatIDR(report.summary.cash_outflow)}
            </p>
          </div>
        </div>
        {report.cash_accounts.length > 0 ? (
          <div className="flex flex-col gap-2">
            {report.cash_accounts.map((account) => (
              <div
                key={account.account_id}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <span className="truncate">
                  <span className="text-muted-foreground mr-2 font-mono text-xs">
                    {account.code}
                  </span>
                  {account.name}
                </span>
                <span className="shrink-0 font-medium">
                  {formatIDR(account.balance)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyReportState message="Belum ada journal kas yang diposting pada periode ini." />
        )}
      </CardContent>
    </Card>
  );
}

function SettlementCard({
  report,
}: {
  report: AccountingReport;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Marketplace settlement</CardTitle>
        <CardDescription>
          Arus payout dan biaya marketplace yang terhubung
          ke piutang.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat
            label="Posted"
            value={String(report.settlements.posted_count)}
          />
          <Stat
            label="Gross"
            value={formatIDR(
              report.settlements.gross_amount
            )}
          />
          <Stat
            label="Fee"
            value={formatIDR(report.settlements.fee_amount)}
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">
            Net payout
          </span>
          <span className="font-semibold">
            {formatIDR(report.settlements.net_amount)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">
            Reconciliation difference
          </span>
          <span
            className={
              report.settlements
                .reconciliation_difference === 0
                ? 'font-medium'
                : 'text-destructive font-medium'
            }
          >
            {formatIDR(
              report.settlements.reconciliation_difference
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-muted-foreground text-xs">
        {label}
      </span>
      <span className="truncate text-sm font-semibold">
        {value}
      </span>
    </div>
  );
}

function DataCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function TrialBalanceTable({
  rows,
}: {
  rows: AccountBalance[];
}) {
  if (!rows.length)
    return (
      <EmptyReportState message="Belum ada journal posted untuk membentuk trial balance." />
    );
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Akun</TableHead>
            <TableHead className="text-right">
              Debit
            </TableHead>
            <TableHead className="text-right">
              Credit
            </TableHead>
            <TableHead className="text-right">
              Saldo normal
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.account_id}>
              <TableCell>
                <span className="text-muted-foreground mr-3 font-mono text-xs">
                  {row.code}
                </span>
                {row.name}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatIDR(row.debit)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatIDR(row.credit)}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatIDR(row.balance)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function InventoryTable({
  rows,
}: {
  rows: AccountingReport['inventory'];
}) {
  if (!rows.length)
    return (
      <EmptyReportState message="Belum ada inventory movement posted sampai akhir periode." />
    );
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead className="text-right">
              Quantity
            </TableHead>
            <TableHead className="text-right">
              Nilai
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.inventory_item_id}>
              <TableCell className="font-medium">
                {row.name}
              </TableCell>
              <TableCell className="text-muted-foreground font-mono text-xs">
                {row.sku}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.quantity} {row.unit}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatIDR(row.value)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function JournalTable({
  rows,
}: {
  rows: AccountingReport['journal_activity'];
}) {
  if (!rows.length)
    return (
      <EmptyReportState message="Belum ada journal posted pada periode ini." />
    );
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Entry</TableHead>
            <TableHead>Deskripsi</TableHead>
            <TableHead>Sumber</TableHead>
            <TableHead className="text-right">
              Amount
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-muted-foreground whitespace-nowrap">
                {formatDate(row.transaction_date)}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {row.entry_number}
              </TableCell>
              <TableCell className="min-w-56 font-medium">
                {row.description}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {row.source_type?.replaceAll('_', ' ') ??
                    'manual'}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatIDR(row.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function EmptyReportState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="bg-muted/40 text-muted-foreground flex min-h-28 items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm">
      <div className="flex max-w-md flex-col items-center gap-2">
        <BookOpenText className="size-5" />
        <span>{message}</span>
      </div>
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <main className="flex min-h-full flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-10 w-96" />
      <Skeleton className="h-96 w-full" />
    </main>
  );
}
