'use client';

import { useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  CircleDollarSign,
  CreditCard,
  Gauge,
  ClipboardList,
  MoveRight,
  PackageSearch,
  ReceiptText,
  ShieldCheck,
  TicketPercent,
  TrendingUp,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import FinancialDisplay from '@/components/shared/general/financial-display';
import { useAppForm } from '@/components/form/form.hook';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { formatIDR } from '@/lib/formatter/format-idr';
import { SalesV2ResponseDTO } from '@/modules/reports/report.dto';
import {
  ReportFormInput,
  ReportFormSchema,
} from '../_components/report.schema';

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
};

const overviewChartConfig = {
  net_sales: {
    label: 'Net Sales',
    color: 'var(--chart-1)',
  },
  net_profit: {
    label: 'Net Profit',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

const pressureChartConfig = {
  shopee_fee: {
    label: 'Shopee Fee',
    color: 'var(--chart-3)',
  },
  seller_discount: {
    label: 'Seller Discount',
    color: 'var(--chart-4)',
  },
} satisfies ChartConfig;

const ReportsOverviewPage = () => {
  const [result, setResult] =
    useState<SalesV2ResponseDTO>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(
    null
  );

  const form = useAppForm({
    defaultValues: {
      date: {
        from: '',
        to: '',
      },
    } as ReportFormInput,
    validators: {
      onDynamic: ReportFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          '/api/v1/dashboard/reports/sales-2',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              startDate: value.date.from,
              endDate: value.date.to,
            }),
            signal: controller.signal,
          }
        );
        const data = await response.json();

        if (response.ok && data.success) {
          setResult(data.data);
          toast.success('Overview report berhasil dibuat.');
        } else {
          setError(
            data.message ||
              'Terjadi kesalahan saat memproses overview report.'
          );
          toast.error(
            data.message || 'Gagal membuat overview report.'
          );
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setError(
            'Terjadi kesalahan teknis. Silakan coba lagi nanti.'
          );
          toast.error('Gagal memproses overview report.');
        }
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        setIsLoading(false);
      }
    },
  });

  const summary = result?.summary;
  const dailyReports = useMemo(
    () => result?.daily_reports || [],
    [result?.daily_reports]
  );
  const topAlerts = useMemo(
    () => result?.alerts.slice(0, 3) || [],
    [result?.alerts]
  );

  return (
    <div className="bg-background text-foreground min-h-screen w-full overflow-x-hidden">
      <header className="bg-card/80 border-b px-4 py-4 backdrop-blur sm:px-6">
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-md">
              <Gauge className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold">
                Reports Overview
              </h1>
              <p className="text-muted-foreground line-clamp-2 text-sm">
                Executive snapshot for sales health, profit
                pressure, and next reports to inspect.
              </p>
            </div>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              form.handleSubmit();
            }}
            className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center xl:w-[520px]"
          >
            <div className="border-input bg-background flex min-w-0 items-center gap-2 rounded-md border px-2 py-1">
              <span className="text-muted-foreground shrink-0 text-xs font-medium">
                Periode
              </span>
              <form.AppField name="date">
                {(field) => (
                  <field.DateRangePresetsField
                    label={undefined}
                    placeholder="Pilih tanggal"
                    className="min-w-0"
                  />
                )}
              </form.AppField>
            </div>
            <form.AppForm>
              <form.SubmitButton
                text={
                  isLoading ? 'Generating...' : 'Generate'
                }
              />
            </form.AppForm>
          </form>
        </div>
      </header>

      <main className="flex min-w-0 flex-col gap-4 p-4 sm:p-6">
        {error ? (
          <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-4 py-3 text-sm">
            {error}
          </div>
        ) : null}

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={TrendingUp}
            label="Net Sales"
            value={formatIDR(summary?.net_sales || 0)}
            sub={`${formatPercent(summary?.net_margin)} net margin`}
          />
          <SignedMetricCard
            icon={CircleDollarSign}
            label="Net Profit"
            value={summary?.net_profit || 0}
            sub={`${formatIDR(summary?.profit_per_order || 0)} / order`}
          />
          <MetricCard
            icon={CreditCard}
            label="Buyer Payment"
            value={formatIDR(summary?.total_payment || 0)}
            sub={`${formatIDR(summary?.average_order_value || 0)} AOV`}
          />
          <MetricCard
            icon={ShieldCheck}
            label="Completed Orders"
            value={formatNumber(summary?.total_orders)}
            sub={`${formatNumber(summary?.total_buyers)} buyers`}
          />
        </section>

        {result ? (
          <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.75fr)]">
            <div className="bg-card rounded-md border">
              <div className="border-b px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium">
                    Executive Readout
                  </h2>
                  <Badge
                    variant={
                      result.health_summary.tone === 'bad'
                        ? 'destructive'
                        : 'outline'
                    }
                  >
                    {result.health_summary.tone}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  {result.health_summary.headline}
                </p>
              </div>
              <div className="grid gap-3 p-3 md:grid-cols-2">
                {result.health_summary.notes.map((note) => (
                  <div
                    key={note}
                    className="bg-background flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <MoveRight className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-md border">
              <div className="border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-muted-foreground size-4" />
                  <h2 className="font-medium">
                    Action Queue
                  </h2>
                </div>
              </div>
              <div className="divide-y">
                {topAlerts.length ? (
                  topAlerts.map((alert) => (
                    <div
                      key={alert.key}
                      className="px-4 py-3 text-sm"
                    >
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span className="font-medium">
                          {alert.title}
                        </span>
                        <Badge
                          variant={
                            alert.severity === 'danger'
                              ? 'destructive'
                              : 'outline'
                          }
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        {alert.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground px-4 py-8 text-center text-sm">
                    Tidak ada action penting untuk periode
                    ini.
                  </p>
                )}
              </div>
            </div>
          </section>
        ) : null}

        {result ? (
          <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
            <div className="bg-card rounded-md border">
              <div className="border-b px-4 py-3">
                <h2 className="font-medium">
                  Sales and Profit Momentum
                </h2>
                <p className="text-muted-foreground text-sm">
                  Daily net sales and net profit from
                  completed Shopee orders.
                </p>
              </div>
              <div className="p-3">
                <ChartContainer
                  config={overviewChartConfig}
                  className="h-72 w-full"
                >
                  <AreaChart data={dailyReports}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis hide />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                    />
                    <Area
                      dataKey="net_sales"
                      type="monotone"
                      stroke="var(--color-net_sales)"
                      fill="var(--color-net_sales)"
                      fillOpacity={0.16}
                    />
                    <Area
                      dataKey="net_profit"
                      type="monotone"
                      stroke="var(--color-net_profit)"
                      fill="var(--color-net_profit)"
                      fillOpacity={0.12}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            </div>

            <div className="bg-card rounded-md border">
              <div className="border-b px-4 py-3">
                <h2 className="font-medium">
                  Profit Pressure
                </h2>
                <p className="text-muted-foreground text-sm">
                  Fee and seller discount trend.
                </p>
              </div>
              <div className="p-3">
                <ChartContainer
                  config={pressureChartConfig}
                  className="h-72 w-full"
                >
                  <BarChart data={dailyReports}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis hide />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                    />
                    <Bar
                      dataKey="shopee_fee"
                      fill="var(--color-shopee_fee)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="seller_discount"
                      fill="var(--color-seller_discount)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          </section>
        ) : null}

        {result ? (
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <SignalCard
              icon={ReceiptText}
              label="Sales Economics"
              value={formatIDR(result.summary.gross_sales)}
              sub={`${formatIDR(result.summary.cogs)} COGS`}
              href="/dashboard/reports/sales-2"
            />
            <SignalCard
              icon={PackageSearch}
              label="Product Signal"
              value="SKU Detail"
              sub="Review product contribution and margin"
              href="/dashboard/reports/products"
            />
            <SignalCard
              icon={UserRound}
              label="Customer Signal"
              value="Repeat Report"
              sub="Repeat order and customer value"
              href="/dashboard/reports/customers"
            />
            <SignalCard
              icon={TicketPercent}
              label="Voucher Signal"
              value={formatPercent(
                result.voucher_summary.discount_ratio
              )}
              sub={`${formatIDR(result.voucher_summary.total_discount)} total discount`}
              href="/dashboard/reports/vouchers"
            />
            <SignalCard
              icon={ClipboardList}
              label="Operations Signal"
              value="Order Quality"
              sub="Cancellation, return, and refund"
              href="/dashboard/reports/operations"
            />
          </section>
        ) : null}

        {summary ? (
          <section className="grid gap-3 xl:grid-cols-3">
            <RatioPanel
              title="Profit Leakage"
              rows={result?.profit_leakage.items || []}
            />
            <div className="bg-card rounded-md border">
              <div className="border-b px-4 py-3">
                <h2 className="font-medium">
                  Order Quality
                </h2>
              </div>
              <div className="divide-y">
                {result?.status_breakdown.length ? (
                  result.status_breakdown.map((status) => (
                    <div
                      key={status.status}
                      className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
                    >
                      <span className="text-muted-foreground capitalize">
                        {status.status.replace(/-/g, ' ')}
                      </span>
                      <Badge variant="outline">
                        {formatNumber(status.orders)}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground px-4 py-8 text-center text-sm">
                    Belum ada status order.
                  </p>
                )}
              </div>
            </div>
            <div className="bg-card rounded-md border">
              <div className="border-b px-4 py-3">
                <h2 className="font-medium">
                  Data Confidence
                </h2>
              </div>
              <div className="grid gap-3 p-3">
                <MiniMetric
                  label="Net Sales Coverage"
                  value={formatPercent(
                    result?.data_quality.net_sales_coverage
                  )}
                />
                <MiniMetric
                  label="Net Profit Coverage"
                  value={formatPercent(
                    result?.data_quality.net_profit_coverage
                  )}
                />
                <MiniMetric
                  label="Released Funds Coverage"
                  value={formatPercent(
                    result?.data_quality
                      .released_funds_coverage
                  )}
                />
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
};

const MetricCard = ({
  icon: Icon,
  label,
  value,
  sub,
}: MetricCardProps) => (
  <Card className="bg-card rounded-md">
    <CardContent className="flex items-center gap-3">
      <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs font-medium uppercase">
          {label}
        </p>
        <p className="truncate text-lg font-semibold">
          {value}
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {sub}
        </p>
      </div>
    </CardContent>
  </Card>
);

const SignedMetricCard = ({
  icon: Icon,
  label,
  value,
  sub,
}: Omit<MetricCardProps, 'value'> & { value: number }) => (
  <Card className="bg-card rounded-md">
    <CardContent className="flex items-center gap-3">
      <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs font-medium uppercase">
          {label}
        </p>
        <FinancialDisplay
          value={value}
          formatter={formatIDR}
          className="truncate text-lg font-semibold"
        />
        <p className="text-muted-foreground truncate text-xs">
          {sub}
        </p>
      </div>
    </CardContent>
  </Card>
);

const SignalCard = ({
  icon: Icon,
  label,
  value,
  sub,
  href,
}: MetricCardProps & { href?: string }) => {
  const content = (
    <Card className="bg-card hover:bg-muted/40 h-full rounded-md transition-colors">
      <CardContent className="flex items-center gap-3">
        <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            {label}
          </p>
          <p className="truncate text-lg font-semibold">
            {value}
          </p>
          <p className="text-muted-foreground truncate text-xs">
            {sub}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return href ? (
    <Link href={href}>{content}</Link>
  ) : (
    content
  );
};

const RatioPanel = ({
  title,
  rows,
}: {
  title: string;
  rows: SalesV2ResponseDTO['profit_leakage']['items'];
}) => (
  <div className="bg-card rounded-md border">
    <div className="border-b px-4 py-3">
      <h2 className="font-medium">{title}</h2>
    </div>
    <div className="space-y-3 p-4">
      {rows.length ? (
        rows.map((row) => (
          <div key={row.key}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                {row.label}
              </span>
              <span className="font-medium">
                {formatPercent(row.ratio)}
              </span>
            </div>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full"
                style={{
                  width: `${Math.min(row.ratio * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        ))
      ) : (
        <p className="text-muted-foreground text-center text-sm">
          Belum ada leakage data.
        </p>
      )}
    </div>
  </div>
);

const MiniMetric = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="bg-background rounded-md border px-3 py-2">
    <p className="text-muted-foreground truncate text-xs">
      {label}
    </p>
    <p className="truncate text-base font-semibold">
      {value}
    </p>
  </div>
);

const formatPercent = (value?: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value || 0);

const formatNumber = (value?: number) =>
  new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 1,
  }).format(value || 0);

export default ReportsOverviewPage;
