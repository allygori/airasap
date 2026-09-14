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
  Banknote,
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
import { OverviewReportResponseDTO } from '@/modules/reports/report.dto';
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
  potential_gross_sales: {
    label: 'Potential Gross Sales',
    color: 'var(--chart-1)',
  },
  realized_gross_sales: {
    label: 'Realized Gross Sales',
    color: 'var(--chart-2)',
  },
  cancelled_gross_sales: {
    label: 'Cancelled Sales',
    color: 'var(--chart-3)',
  },
  net_profit: {
    label: 'Net Profit',
    color: 'var(--chart-4)',
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
    useState<OverviewReportResponseDTO>();
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
          '/api/v1/dashboard/reports/overview',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              startDate: value.date.from,
              endDate: value.date.to,
              mode: value.date.mode,
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
    () => buildOverviewAlerts(result),
    [result]
  );
  const readout = useMemo(
    () => buildOverviewReadout(result),
    [result]
  );

  return (
    <div className="bg-background text-foreground min-h-screen w-full overflow-x-hidden">
      <header className="bg-card/80 border-b px-3 py-4 backdrop-blur sm:px-6">
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
              {/* <span className="text-muted-foreground shrink-0 text-xs font-medium">
                Periode
              </span> */}
              <form.AppField name="date">
                {(field) => (
                  <field.DateRangePresetsField
                    label={undefined}
                    placeholder="Periode: Pilih tanggal"
                    className="max-w-full min-w-0"
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

      <main className="flex min-w-0 flex-col gap-4 p-3 sm:p-6">
        {error ? (
          <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-4 py-3 text-sm">
            {error}
          </div>
        ) : null}

        <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            icon={TrendingUp}
            label="Potential Gross Sales"
            value={formatIDR(
              summary?.potential_gross_sales || 0
            )}
            sub={`${formatNumber(summary?.total_orders)} total orders`}
          />
          <MetricCard
            icon={AlertTriangle}
            label="Cancelled Sales"
            value={formatIDR(
              summary?.cancelled_gross_sales || 0
            )}
            sub={`${formatPercent(summary?.cancellation_rate_by_value)} by value`}
          />
          <MetricCard
            icon={ShieldCheck}
            label="Realized Gross Sales"
            value={formatIDR(
              summary?.realized_gross_sales || 0
            )}
            sub={`${formatPercent(summary?.sales_realization_rate)} realization`}
          />
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
            label="Completed Buyers"
            value={formatNumber(summary?.completed_buyers)}
            sub={`${formatNumber(summary?.completed_units)} realized units`}
          />
          <SignedMetricCard
            icon={Banknote}
            label="Shopee Fee"
            value={summary?.shopee_fee || 0}
            sub={`${formatPercent(summary?.fee_ratio)} of realized gross sales`}
          />
          <MetricCard
            icon={ReceiptText}
            label="All Orders"
            value={formatNumber(summary?.total_orders)}
            sub={`${formatNumber(summary?.total_buyers)} buyers`}
          />
          <MetricCard
            icon={ShieldCheck}
            label="Completed Orders"
            value={formatNumber(summary?.completed_orders)}
            sub={`${formatNumber(summary?.completed_buyers)} buyers`}
          />
          <MetricCard
            icon={AlertTriangle}
            label="Cancelled Orders"
            value={formatNumber(summary?.cancelled_orders)}
            sub={`${formatPercent(summary?.cancellation_rate_by_orders)} by order count`}
          />
          <MetricCard
            icon={ClipboardList}
            label="In Progress Orders"
            value={formatNumber(
              summary?.in_progress_orders
            )}
            sub={formatIDR(
              summary?.in_progress_gross_sales || 0
            )}
          />
          <MetricCard
            icon={ClipboardList}
            label="Return / Refund Orders"
            value={formatNumber(
              summary?.return_refund_orders
            )}
            sub={formatIDR(
              summary?.return_refund_gross_sales || 0
            )}
          />
          <MetricCard
            icon={TicketPercent}
            label="Seller Discount"
            value={formatIDR(summary?.seller_discount || 0)}
            sub={`${formatPercent(summary?.seller_discount_ratio)} of realized gross sales`}
          />
          <MetricCard
            icon={TicketPercent}
            label="Shopee Discount"
            value={formatIDR(summary?.shopee_discount || 0)}
            sub={`${formatPercent(summary?.shopee_discount_ratio)} of realized gross sales`}
          />
        </section>

        {result ? (
          <section className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.75fr)]">
            <div className="bg-card min-w-0 rounded-md border">
              <div className="border-b px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium">
                    Executive Readout
                  </h2>
                  <Badge
                    variant={
                      readout.tone === 'bad'
                        ? 'destructive'
                        : 'outline'
                    }
                  >
                    {readout.tone}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  {readout.headline}
                </p>
              </div>
              <div className="grid gap-3 p-3 md:grid-cols-2">
                {readout.notes.map((note) => (
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

            <div className="bg-card min-w-0 rounded-md border">
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
          <section className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
            <div className="bg-card min-w-0 rounded-md border">
              <div className="border-b px-4 py-3">
                <h2 className="font-medium">
                  Sales and Profit Momentum
                </h2>
                <p className="text-muted-foreground text-sm">
                  Potential, realized, cancelled sales, and
                  net profit by local store date.
                </p>
              </div>
              <div className="min-w-0 p-3">
                <ChartContainer
                  config={overviewChartConfig}
                  className="h-56 w-full min-w-0 sm:h-72"
                >
                  <AreaChart data={dailyReports}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      tick={{ fontSize: 10 }}
                      minTickGap={16}
                    />
                    <YAxis hide />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                    />
                    <Area
                      dataKey="potential_gross_sales"
                      type="monotone"
                      stroke="var(--color-potential_gross_sales)"
                      fill="var(--color-potential_gross_sales)"
                      fillOpacity={0.16}
                    />
                    <Area
                      dataKey="realized_gross_sales"
                      type="monotone"
                      stroke="var(--color-realized_gross_sales)"
                      fill="var(--color-realized_gross_sales)"
                      fillOpacity={0.12}
                    />
                    <Area
                      dataKey="cancelled_gross_sales"
                      type="monotone"
                      stroke="var(--color-cancelled_gross_sales)"
                      fill="var(--color-cancelled_gross_sales)"
                      fillOpacity={0.1}
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

            <div className="bg-card min-w-0 rounded-md border">
              <div className="border-b px-4 py-3">
                <h2 className="font-medium">
                  Profit Pressure
                </h2>
                <p className="text-muted-foreground text-sm">
                  Fee and seller discount trend.
                </p>
              </div>
              <div className="min-w-0 p-3">
                <ChartContainer
                  config={pressureChartConfig}
                  className="h-56 w-full min-w-0 sm:h-72"
                >
                  <BarChart data={dailyReports}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      tick={{ fontSize: 10 }}
                      minTickGap={16}
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
          <section className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <SignalCard
              icon={ReceiptText}
              label="Order Report"
              value={formatIDR(
                result.summary.realized_gross_sales
              )}
              sub={`${formatIDR(result.summary.cogs)} COGS`}
              href="/dashboard/reports/orders"
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
                result.summary.seller_discount_ratio
              )}
              sub={`${formatIDR(result.summary.seller_discount)} seller discount`}
              href="/dashboard/reports/vouchers"
            />
            <SignalCard
              icon={ClipboardList}
              label="Operations Signal"
              value={formatNumber(
                result.summary.cancelled_orders
              )}
              sub={`${formatIDR(result.summary.cancelled_gross_sales)} cancelled sales`}
              href="/dashboard/reports/operations"
            />
          </section>
        ) : null}

        {summary ? (
          <section className="grid min-w-0 gap-3 xl:grid-cols-3">
            <RatioPanel
              title="Profit Leakage"
              rows={buildOverviewLeakage(result?.summary)}
            />
            <div className="bg-card rounded-md border">
              <div className="border-b px-4 py-3">
                <h2 className="font-medium">
                  Order Quality
                </h2>
              </div>
              <div className="divide-y">
                {result?.funnel.length ? (
                  result.funnel.map((status) => (
                    <div
                      key={status.bucket}
                      className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
                    >
                      <span className="text-muted-foreground capitalize">
                        {status.bucket.replace(/_/g, ' ')}
                      </span>
                      <Badge variant="outline">
                        {formatNumber(status.orders)} ·{' '}
                        {formatIDR(status.gross_sales)}
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
                    result?.summary.net_sales_coverage
                  )}
                />
                <MiniMetric
                  label="Net Profit Coverage"
                  value={formatPercent(
                    result?.summary.net_profit_coverage
                  )}
                />
                <MiniMetric
                  label="Released Funds Coverage"
                  value={formatPercent(
                    result?.summary.released_funds_coverage
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

type OverviewAlert = {
  key: string;
  severity: 'info' | 'warning' | 'danger';
  title: string;
  message: string;
};

const buildOverviewAlerts = (
  report?: OverviewReportResponseDTO
): OverviewAlert[] => {
  if (!report) return [];

  const { summary } = report;
  const alerts: OverviewAlert[] = [];

  if (summary.net_margin < 0) {
    alerts.push({
      key: 'negative-net-margin',
      severity: 'danger',
      title: 'Net margin negatif',
      message:
        'Net profit negatif setelah COGS, fee, dan diskon.',
    });
  } else if (summary.net_margin < 0.1) {
    alerts.push({
      key: 'thin-net-margin',
      severity: 'warning',
      title: 'Net margin tipis',
      message:
        'Margin di bawah 10% dan rentan tertekan biaya.',
    });
  }

  if (summary.cancellation_rate_by_value >= 0.1) {
    alerts.push({
      key: 'high-cancellation-value',
      severity: 'danger',
      title: 'Potential sales banyak hilang',
      message: `${formatPercent(summary.cancellation_rate_by_value)} potential gross sales berasal dari order batal.`,
    });
  }

  if (summary.fee_ratio >= 0.12) {
    alerts.push({
      key: 'high-fee-ratio',
      severity: 'warning',
      title: 'Fee Shopee tinggi',
      message:
        'Fee Shopee melewati 12% dari realized gross sales.',
    });
  }

  if (summary.seller_discount_ratio >= 0.1) {
    alerts.push({
      key: 'high-seller-discount',
      severity: 'warning',
      title: 'Diskon seller tinggi',
      message:
        'Diskon seller melewati 10% dari realized gross sales.',
    });
  }

  if (
    summary.net_sales_coverage < 0.9 ||
    summary.net_profit_coverage < 0.9
  ) {
    alerts.push({
      key: 'low-data-confidence',
      severity: 'info',
      title: 'Data confidence belum penuh',
      message:
        'Sebagian order selesai masih memakai fallback financial.',
    });
  }

  return alerts.slice(0, 5);
};

const buildOverviewReadout = (
  report?: OverviewReportResponseDTO
) => {
  if (!report) {
    return {
      tone: 'neutral' as const,
      headline:
        'Belum ada data overview untuk periode ini.',
      notes: [],
    };
  }

  const { summary } = report;
  const tone =
    summary.net_margin < 0
      ? 'bad'
      : summary.net_margin < 0.1 ||
          summary.cancellation_rate_by_value >= 0.1 ||
          summary.fee_ratio >= 0.12
        ? 'warning'
        : 'good';

  const notes = [
    `${formatIDR(summary.realized_gross_sales)} realized gross sales dari ${formatIDR(summary.potential_gross_sales)} potential sales.`,
    `${formatIDR(summary.cancelled_gross_sales)} potential sales hilang karena cancellation.`,
    `${formatNumber(summary.completed_orders)} order selesai dari ${formatNumber(summary.total_orders)} seluruh order.`,
    `Net profit ${formatIDR(summary.net_profit)} dengan margin ${formatPercent(summary.net_margin)}.`,
  ];

  return {
    tone: tone as 'good' | 'warning' | 'bad',
    headline:
      tone === 'bad'
        ? 'Sales menghasilkan rugi dan perlu segera ditinjau.'
        : tone === 'warning'
          ? 'Sales berjalan, tetapi ada tekanan cancellation atau margin.'
          : 'Sales dan profit berada dalam kondisi sehat.',
    notes,
  };
};

const buildOverviewLeakage = (
  summary?: OverviewReportResponseDTO['summary']
) => {
  if (!summary) return [];

  const grossSales = summary.realized_gross_sales || 0;
  return [
    { key: 'cogs', label: 'COGS', value: summary.cogs },
    {
      key: 'shopee_fee',
      label: 'Shopee Fee',
      value: summary.shopee_fee,
    },
    {
      key: 'seller_discount',
      label: 'Seller Discount',
      value: summary.seller_discount,
    },
    {
      key: 'marketplace_deduction',
      label: 'Marketplace Deduction',
      value: summary.marketplace_deduction,
    },
  ].map((item) => ({
    ...item,
    ratio: grossSales > 0 ? item.value / grossSales : 0,
  }));
};

const RatioPanel = ({
  title,
  rows,
}: {
  title: string;
  rows: Array<{
    key: string;
    label: string;
    value: number;
    ratio: number;
  }>;
}) => (
  <div className="bg-card rounded-md border">
    <div className="border-b px-4 py-3">
      <h2 className="font-medium">{title}</h2>
    </div>
    <div className="flex flex-col gap-3 p-4">
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
