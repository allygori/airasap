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
  ArrowDownUp,
  BadgePercent,
  Banknote,
  Boxes,
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  Database,
  HandCoins,
  MoveDownRight,
  MoveRight,
  MoveUpRight,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  TicketPercent,
  Trophy,
  TrendingUp,
  type LucideIcon,
  WalletCards,
} from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatIDR } from '@/lib/formatter/format-idr';
import { OrderReportResponseDTO } from '@/modules/reports/report.dto';
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

const moneyChartConfig = {
  net_sales: {
    label: 'Net Sales',
    color: 'var(--color-success)',
  },
  net_profit: {
    label: 'Net Profit',
    color: 'var(--color-info)',
  },
} satisfies ChartConfig;

const orderChartConfig = {
  orders: {
    label: 'Orders',
    color: 'var(--color-info)',
  },
  units: {
    label: 'Units',
    color: 'var(--color-success)',
  },
} satisfies ChartConfig;

const OrderReportPage = () => {
  const [result, setResult] =
    useState<OrderReportResponseDTO>();
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
          '/api/v1/dashboard/reports/orders',
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
          toast.success(
            'Order Report Report berhasil dibuat.'
          );
        } else {
          setError(
            data.message ||
              'Terjadi kesalahan saat memproses Order Report Report.'
          );
          toast.error(
            data.message ||
              'Gagal membuat Order Report Report.'
          );
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setError(
            'Terjadi kesalahan teknis. Silakan coba lagi nanti.'
          );
          toast.error(
            'Gagal memproses Order Report Report.'
          );
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
  const comparison = result?.comparison;
  const dailyReports = useMemo(
    () => result?.daily_reports || [],
    [result?.daily_reports]
  );
  const feeRows = useMemo(
    () => getFeeRows(result?.fee_breakdown),
    [result?.fee_breakdown]
  );

  return (
    <div className="bg-background text-foreground min-h-screen w-full overflow-x-hidden">
      <header className="bg-card/80 border-b px-3 py-4 backdrop-blur sm:px-6">
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-md">
              <ShoppingBag className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold">
                Order Report
              </h1>
              <p className="text-muted-foreground line-clamp-2 text-sm">
                Order-level view for revenue, payout,
                margin, fees, discounts, and daily momentum.
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
                    placeholder="Pilih tanggal"
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

        <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={ReceiptText}
            label="Gross Sales"
            value={formatIDR(summary?.gross_sales || 0)}
            sub={`${formatPercent(summary?.gross_margin)} gross margin`}
          />
          <MetricCard
            icon={TrendingUp}
            label="Net Sales"
            value={formatIDR(summary?.net_sales || 0)}
            sub={`${formatPercent(summary?.net_margin)} net margin`}
          />

          <MetricCard
            icon={CreditCard}
            label="Pembayaran Pembeli"
            value={formatIDR(summary?.total_payment || 0)}
            sub={`${formatIDR(summary?.average_order_value || 0)} AOV`}
          />
          <MetricCard
            icon={Boxes}
            label="COGS"
            value={formatIDR(summary?.cogs || 0)}
            sub={`${formatNumber(summary?.total_units)} units sold`}
          />
        </section>

        <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={ShieldCheck}
            label="Order Selesai"
            value={formatNumber(summary?.total_orders)}
            sub={`${formatNumber(summary?.total_buyers)} buyers`}
          />
          <SignedMetricCard
            icon={CircleDollarSign}
            label="Net Profit"
            value={summary?.net_profit || 0}
            sub={`${formatIDR(summary?.profit_per_order || 0)} / order`}
          />

          <SignedMetricCard
            icon={ArrowDownUp}
            label="Shopee Fee"
            value={
              summary?.shopee_fee && summary?.shopee_fee > 0
                ? -1 * summary?.shopee_fee
                : summary?.shopee_fee || 0
            }
            sub={`${formatPercent(summary?.fee_ratio)} of gross sales`}
          />
          <SignedMetricCard
            icon={TicketPercent}
            label="Seller Discount"
            value={
              summary?.seller_discount &&
              summary?.seller_discount > 0
                ? -1 * summary?.seller_discount
                : summary?.seller_discount || 0
            }
            sub={`${formatPercent(summary?.seller_discount_ratio)} of gross sales`}
          />
        </section>

        {result ? (
          <section className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
            <div className="bg-card min-w-0 rounded-md border">
              <div className="border-b px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium">
                    Order Health Summary
                  </h2>
                  <Badge
                    variant={
                      result.health_summary.tone === 'bad'
                        ? 'destructive'
                        : result.health_summary.tone ===
                            'warning'
                          ? 'warning'
                          : result.health_summary.tone ===
                              'good'
                            ? 'success'
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
                    <ShieldCheck className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card min-w-0 rounded-md border">
              <div className="border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-warning size-4" />
                  <h2 className="font-medium">
                    Threshold Alerts
                  </h2>
                </div>
              </div>
              <div className="divide-y">
                {result.alerts.length ? (
                  result.alerts.slice(0, 4).map((alert) => (
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
                              : alert.severity === 'warning'
                                ? 'warning'
                                : 'info'
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
                    Tidak ada alert penting di periode ini.
                  </p>
                )}
              </div>
            </div>
          </section>
        ) : null}

        {comparison && summary ? (
          <section className="bg-card rounded-md border">
            <div className="flex min-w-0 flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="font-medium">
                  Period Growth
                </h2>
                <p className="text-muted-foreground text-sm">
                  Dibandingkan dengan periode sebelumnya
                  yang panjangnya sama.
                </p>
              </div>
              <Badge variant="outline">
                Previous:{' '}
                {formatShortDate(
                  comparison.previous_period.start_date
                )}{' '}
                -{' '}
                {formatShortDate(
                  comparison.previous_period.end_date
                )}
              </Badge>
            </div>
            <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-6">
              <GrowthCard
                label="Net Sales"
                current={formatIDR(summary.net_sales)}
                previous={formatIDR(
                  comparison.summary.net_sales
                )}
                change={comparison.changes.net_sales}
              />
              <GrowthCard
                label="Net Profit"
                current={formatIDR(summary.net_profit)}
                previous={formatIDR(
                  comparison.summary.net_profit
                )}
                change={comparison.changes.net_profit}
              />
              <GrowthCard
                label="Payment"
                current={formatIDR(summary.total_payment)}
                previous={formatIDR(
                  comparison.summary.total_payment
                )}
                change={comparison.changes.total_payment}
              />
              <GrowthCard
                label="Orders"
                current={formatNumber(summary.total_orders)}
                previous={formatNumber(
                  comparison.summary.orders
                )}
                change={comparison.changes.orders}
              />
              <GrowthCard
                label="AOV"
                current={formatIDR(
                  summary.average_order_value
                )}
                previous={formatIDR(
                  comparison.summary.average_order_value
                )}
                change={
                  comparison.changes.average_order_value
                }
              />
              <GrowthCard
                label="Net Margin"
                current={formatPercent(summary.net_margin)}
                previous={formatPercent(
                  comparison.summary.net_margin
                )}
                change={comparison.changes.net_margin}
                isPointChange
              />
            </div>
          </section>
        ) : null}

        {summary ? (
          <section className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
            <div className="bg-card min-w-0 overflow-hidden rounded-md border">
              <div className="border-b px-4 py-3">
                <h2 className="font-medium">
                  Orders Momentum
                </h2>
                <p className="text-muted-foreground text-sm">
                  Net sales and net profit by order date.
                </p>
              </div>
              <div className="min-w-0 overflow-hidden p-3">
                <ChartContainer
                  config={moneyChartConfig}
                  className="h-56 w-full min-w-0 overflow-hidden sm:h-72"
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
                      interval="preserveStartEnd"
                      tickFormatter={(value) =>
                        formatShortDate(
                          String(value)
                        ).replace(/\s\d{4}$/, '')
                      }
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
                      fillOpacity={0.18}
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
                  Decision Signals
                </h2>
                <p className="text-muted-foreground text-sm">
                  Tekanan biaya dan kualitas order periode
                  ini.
                </p>
              </div>
              <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-1">
                <SignalRow
                  icon={BadgePercent}
                  label="Fee Pressure"
                  value={formatPercent(summary.fee_ratio)}
                  tone={getRatioTone(
                    summary.fee_ratio,
                    0.12
                  )}
                />
                <SignalRow
                  icon={TicketPercent}
                  label="Seller Discount Pressure"
                  value={formatPercent(
                    summary.seller_discount_ratio
                  )}
                  tone={getRatioTone(
                    summary.seller_discount_ratio,
                    0.1
                  )}
                />
                <SignalRow
                  icon={HandCoins}
                  label="Profit / Order"
                  value={formatIDR(
                    summary.profit_per_order
                  )}
                  tone={
                    summary.profit_per_order > 0
                      ? 'good'
                      : 'bad'
                  }
                />
                <SignalRow
                  icon={WalletCards}
                  label="Shopee Discount"
                  value={formatIDR(summary.shopee_discount)}
                  tone="neutral"
                />
              </div>
            </div>
          </section>
        ) : null}

        {result ? (
          <section className="bg-card rounded-md border">
            <div className="flex min-w-0 flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="font-medium">
                  Shopee Economics
                </h2>
                <p className="text-muted-foreground text-sm">
                  Estimasi net revenue Shopee dari fee
                  dikurangi subsidi Shopee.
                </p>
              </div>
              <Badge variant="outline">
                Estimated take rate{' '}
                {formatPercent(
                  result.shopee_economics
                    .estimated_shopee_take_rate
                )}
              </Badge>
            </div>
            <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-4">
              <SignedMetricCard
                icon={ArrowDownUp}
                label="Total Shopee Fee"
                color="yellow"
                value={
                  result.shopee_economics.total_shopee_fee
                }
                // value={formatIDR(
                //   result.shopee_economics.total_shopee_fee
                // )}
                sub="All fee fields"
              />
              <SignedMetricCard
                icon={ShieldCheck}
                label="Shopee Subsidy"
                color="blue"
                value={
                  result.shopee_economics
                    .total_shopee_subsidy
                }
                sub="Discount + voucher + bundle"
              />
              <SignedMetricCard
                icon={Banknote}
                label="Estimated Shopee Net Revenue"
                color="red"
                value={
                  result.shopee_economics
                    .estimated_shopee_net_revenue
                }
                sub="Total fee - Shopee subsidy"
              />
              <MetricCard
                icon={HandCoins}
                label="Shipping Forwarded"
                value={formatIDR(
                  result.shopee_economics
                    .shipping_forwarded_by_shopee
                )}
                sub="Passed to logistics"
              />
            </div>
            <div className="grid gap-3 border-t p-3 md:grid-cols-3">
              <ShopeeEconomicsGroup
                title="Fee Components"
                rows={[
                  {
                    label: 'Admin Fee',
                    value:
                      result.shopee_economics.admin_fee,
                  },
                  {
                    label: 'Processing Fee',
                    value:
                      result.shopee_economics
                        .processing_fee,
                  },
                  {
                    label: 'GOX Fee',
                    value: result.shopee_economics.gox_fee,
                  },
                  {
                    label: 'Other Fee',
                    value:
                      result.shopee_economics.other_fee,
                  },
                ]}
              />
              <ShopeeEconomicsGroup
                title="Shopee Subsidy"
                rows={[
                  {
                    label: 'Discount from Shopee',
                    value:
                      result.shopee_economics
                        .discount_from_shopee,
                  },
                  {
                    label: 'Voucher by Shopee',
                    value:
                      result.shopee_economics
                        .voucher_borne_by_shopee,
                  },
                  {
                    label: 'Bundle Deal by Shopee',
                    value:
                      result.shopee_economics
                        .bundle_deal_discount_from_shopee,
                  },
                ]}
              />
              <div className="bg-background rounded-md border p-3">
                <p className="text-muted-foreground mb-3 text-xs font-medium uppercase">
                  Interpretation
                </p>
                <p className="text-sm">
                  Angka ini adalah estimasi take Shopee dari
                  order toko: semua fee dikurangi subsidi
                  Shopee. Ongkir diteruskan ke jasa kirim
                  ditampilkan sebagai pass-through, bukan
                  revenue bersih Shopee.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {summary && result ? (
          <section className="grid min-w-0 gap-3 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
            <div className="bg-card min-w-0 rounded-md border">
              <div className="border-b px-4 py-3">
                <h2 className="font-medium">
                  Profit Bridge
                </h2>
                <p className="text-muted-foreground text-sm">
                  Dari gross sales menuju net profit.
                </p>
              </div>
              <div className="flex flex-col gap-3 p-4">
                <BridgeRow
                  label="Gross Sales"
                  value={summary.gross_sales}
                />
                <BridgeRow
                  label="Seller Discount"
                  value={-summary.seller_discount}
                  signed
                />
                <BridgeRow
                  label="Shopee Fee"
                  value={-summary.shopee_fee}
                  signed
                />
                <BridgeRow
                  label="COGS"
                  value={-summary.cogs}
                  signed
                />
                <div className="border-t pt-3">
                  <BridgeRow
                    label="Net Profit"
                    value={summary.net_profit}
                    signed
                    strong
                  />
                </div>
              </div>
            </div>

            <div className="bg-card min-w-0 rounded-md border">
              <div className="border-b px-4 py-3">
                <h2 className="font-medium">
                  Orders and Units
                </h2>
                <p className="text-muted-foreground text-sm">
                  Daily completed order count and unit
                  movement.
                </p>
              </div>
              <div className="min-w-0 p-3">
                <ChartContainer
                  config={orderChartConfig}
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
                      dataKey="orders"
                      fill="var(--color-orders)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="units"
                      fill="var(--color-units)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          </section>
        ) : null}

        {result ? (
          <section className="grid min-w-0 gap-3 xl:grid-cols-3">
            <HighlightPanel
              title="Best Days"
              icon={Trophy}
              rows={result.best_days}
            />
            <HighlightPanel
              title="Worst Days"
              icon={CalendarDays}
              rows={result.worst_days}
            />
            <div className="bg-card rounded-md border">
              <div className="border-b px-4 py-3">
                <h2 className="font-medium">
                  Order Report
                </h2>
              </div>
              <div className="grid gap-3 p-3">
                <MiniMetric
                  label="Profit / Unit"
                  value={formatIDR(
                    result.order_metrics
                      .average_profit_per_unit
                  )}
                />
                <MiniMetric
                  label="COGS / Order"
                  value={formatIDR(
                    result.order_metrics
                      .average_cogs_per_order
                  )}
                />
                <MiniMetric
                  label="Fee / Order"
                  value={formatIDR(
                    result.order_metrics
                      .average_fee_per_order
                  )}
                />
                <MiniMetric
                  label="Seller Discount / Order"
                  value={formatIDR(
                    result.order_metrics
                      .average_seller_discount_per_order
                  )}
                />
              </div>
            </div>
          </section>
        ) : null}

        {result ? (
          <section className="grid min-w-0 gap-3 xl:grid-cols-3">
            <ProfitLeakagePanel result={result} />
            <BreakdownTable
              title="Fee Breakdown"
              rows={feeRows}
              emptyText="Belum ada fee di periode ini."
            />
            <StatusBreakdown result={result} />
          </section>
        ) : null}

        {result ? (
          <section className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
            <VoucherSnapshot result={result} />
            <DataQualityPanel result={result} />
          </section>
        ) : null}

        <section className="bg-card min-w-0 rounded-md border">
          <div className="flex min-w-0 flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-medium">
                Daily Orders Table
              </h2>
              <p className="text-muted-foreground text-sm">
                Order-level daily totals from completed
                Shopee orders.
              </p>
            </div>
            <Badge variant="outline">
              {formatNumber(dailyReports.length)} days
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">
                    Orders
                  </TableHead>
                  <TableHead className="text-right">
                    Units
                  </TableHead>
                  <TableHead className="text-right">
                    Net Sales
                  </TableHead>
                  <TableHead className="text-right">
                    Payment
                  </TableHead>
                  <TableHead className="text-right">
                    Net Profit
                  </TableHead>
                  <TableHead className="text-right">
                    Margin
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyReports.length ? (
                  dailyReports.map((row) => (
                    <TableRow key={row.date}>
                      <TableCell className="min-w-32">
                        {formatShortDate(row.date)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(row.orders)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(row.units)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatIDR(row.net_sales)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatIDR(row.total_payment)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <FinancialDisplay
                            value={row.net_profit}
                            formatter={formatIDR}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <FinancialDisplay
                            value={row.net_margin}
                            formatter={formatPercent}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-muted-foreground h-32 text-center text-sm"
                    >
                      Pilih periode untuk membuat sales
                      report v2.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>
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
  color,
  sub,
}: Omit<MetricCardProps, 'value'> & {
  value: number;
  color?: 'red' | 'green' | 'yellow' | 'blue' | null;
}) => (
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
          color={color}
          className="truncate text-lg font-semibold"
        />
        <p className="text-muted-foreground truncate text-xs">
          {sub}
        </p>
      </div>
    </CardContent>
  </Card>
);

const GrowthCard = ({
  label,
  current,
  previous,
  change,
  isPointChange = false,
}: {
  label: string;
  current: string;
  previous: string;
  change: number;
  isPointChange?: boolean;
}) => {
  const direction =
    change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
  const DirectionIcon =
    direction === 'up'
      ? MoveUpRight
      : direction === 'down'
        ? MoveDownRight
        : MoveRight;
  const changeText = isPointChange
    ? `${change >= 0 ? '+' : ''}${formatPercent(change)} pt`
    : `${change >= 0 ? '+' : ''}${formatPercent(change)}`;

  return (
    <div className="bg-background rounded-md border px-3 py-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-muted-foreground truncate text-xs font-medium uppercase">
          {label}
        </p>
        <Badge
          variant={
            direction === 'down'
              ? 'destructive'
              : direction === 'up'
                ? 'success'
                : 'outline'
          }
          className="gap-1"
        >
          <FinancialDisplay
            value={change}
            formatter={() =>
              changeText.replace(/^[+-]/, '')
            }
            showSign
            Prefix={DirectionIcon}
            className="text-xs"
          />
        </Badge>
      </div>
      <p className="truncate text-lg font-semibold">
        {current}
      </p>
      <p className="text-muted-foreground truncate text-xs">
        Previous {previous}
      </p>
    </div>
  );
};

const SignalRow = ({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: 'good' | 'bad' | 'neutral';
}) => (
  <div className="bg-background flex items-center justify-between gap-3 rounded-md border px-3 py-2">
    <div className="flex min-w-0 items-center gap-2">
      <Icon className="text-muted-foreground size-4 shrink-0" />
      <span className="text-muted-foreground truncate text-sm">
        {label}
      </span>
    </div>
    <span
      className={
        tone === 'good'
          ? 'text-success font-medium'
          : tone === 'bad'
            ? 'text-destructive font-medium'
            : 'font-medium'
      }
    >
      {value}
    </span>
  </div>
);

const ShopeeEconomicsGroup = ({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: number }[];
}) => (
  <div className="bg-background rounded-md border p-3">
    <p className="text-muted-foreground mb-3 text-xs font-medium uppercase">
      {title}
    </p>
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between gap-3 text-sm"
        >
          <span className="text-muted-foreground truncate">
            {row.label}
          </span>
          <span className="shrink-0 font-medium">
            {formatIDR(row.value)}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const BridgeRow = ({
  label,
  value,
  signed = false,
  strong = false,
}: {
  label: string;
  value: number;
  signed?: boolean;
  strong?: boolean;
}) => (
  <div className="flex items-center justify-between gap-3">
    <span
      className={
        strong
          ? 'font-medium'
          : 'text-muted-foreground text-sm'
      }
    >
      {label}
    </span>
    {signed ? (
      <FinancialDisplay
        value={value}
        formatter={formatIDR}
        className={strong ? 'font-semibold' : 'text-sm'}
      />
    ) : (
      <span
        className={strong ? 'font-semibold' : 'text-sm'}
      >
        {formatIDR(value)}
      </span>
    )}
  </div>
);

const HighlightPanel = ({
  title,
  icon: Icon,
  rows,
}: {
  title: string;
  icon: LucideIcon;
  rows: OrderReportResponseDTO['best_days'];
}) => (
  <div className="bg-card rounded-md border">
    <div className="border-b px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon
          className={
            title === 'Best Days'
              ? 'text-success size-4'
              : 'text-danger size-4'
          }
        />
        <h2 className="font-medium">{title}</h2>
      </div>
    </div>
    <div className="divide-y">
      {rows.length ? (
        rows.map((row) => (
          <div
            key={`${row.label}-${row.metric}`}
            className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">
                {row.label}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {row.date ? formatShortDate(row.date) : '-'}
              </p>
            </div>
            <span className="font-medium">
              {formatHighlightValue(row)}
            </span>
          </div>
        ))
      ) : (
        <p className="text-muted-foreground px-4 py-8 text-center text-sm">
          Belum ada data harian.
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

const ProfitLeakagePanel = ({
  result,
}: {
  result: OrderReportResponseDTO;
}) => (
  <div className="bg-card rounded-md border">
    <div className="border-b px-4 py-3">
      <h2 className="font-medium">Profit Leakage</h2>
      <p className="text-muted-foreground text-sm">
        Komponen utama yang mengurangi gross sales.
      </p>
    </div>
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground text-sm">
          Total leakage
        </span>
        <span className="font-semibold">
          {formatIDR(result.profit_leakage.total_leakage)}
        </span>
      </div>
      {result.profit_leakage.items.map((item) => (
        <div key={item.key}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">
              {item.label}
            </span>
            <span className="font-medium">
              {formatPercent(item.ratio)}
            </span>
          </div>
          <div className="bg-muted h-2 overflow-hidden rounded-full">
            <div
              className="bg-danger h-full rounded-full"
              style={{
                width: `${Math.min(item.ratio * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const VoucherSnapshot = ({
  result,
}: {
  result: OrderReportResponseDTO;
}) => (
  <div className="bg-card rounded-md border">
    <div className="border-b px-4 py-3">
      <h2 className="font-medium">Voucher Snapshot</h2>
      <p className="text-muted-foreground text-sm">
        Teaser untuk report voucher/campaign nanti.
      </p>
    </div>
    <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-1">
      <MiniMetric
        label="Voucher Codes"
        value={formatNumber(
          result.voucher_summary.voucher_codes_count
        )}
      />
      <MiniMetric
        label="Total Discount"
        value={formatIDR(
          result.voucher_summary.total_discount
        )}
      />
      <MiniMetric
        label="Seller Share"
        value={formatPercent(
          result.voucher_summary.seller_share
        )}
      />
      <MiniMetric
        label="Discount Ratio"
        value={formatPercent(
          result.voucher_summary.discount_ratio
        )}
      />
    </div>
    {result.voucher_summary.top_codes.length ? (
      <div className="flex flex-wrap gap-2 border-t p-3">
        {result.voucher_summary.top_codes.map((code) => (
          <Badge key={code} variant="outline">
            {code}
          </Badge>
        ))}
      </div>
    ) : null}
  </div>
);

const BreakdownTable = ({
  title,
  rows,
  emptyText,
}: {
  title: string;
  rows: { label: string; value: number }[];
  emptyText: string;
}) => (
  <div className="bg-card rounded-md border">
    <div className="border-b px-4 py-3">
      <h2 className="font-medium">{title}</h2>
    </div>
    <div className="divide-y">
      {rows.length ? (
        rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
          >
            <span className="text-muted-foreground truncate capitalize">
              {row.label}
            </span>
            <span className="font-medium">
              {formatIDR(row.value)}
            </span>
          </div>
        ))
      ) : (
        <p className="text-muted-foreground px-4 py-8 text-center text-sm">
          {emptyText}
        </p>
      )}
    </div>
  </div>
);

const StatusBreakdown = ({
  result,
}: {
  result: OrderReportResponseDTO;
}) => (
  <div className="bg-card rounded-md border">
    <div className="border-b px-4 py-3">
      <h2 className="font-medium">Status Breakdown</h2>
    </div>
    <div className="divide-y">
      {result.status_breakdown.length ? (
        result.status_breakdown.map((row) => (
          <div
            key={row.status}
            className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
          >
            <span className="text-muted-foreground truncate capitalize">
              {row.status.replace(/-/g, ' ')}
            </span>
            <Badge variant="outline">
              {formatNumber(row.orders)} orders
            </Badge>
          </div>
        ))
      ) : (
        <p className="text-muted-foreground px-4 py-8 text-center text-sm">
          Belum ada order di periode ini.
        </p>
      )}
    </div>
  </div>
);

const DataQualityPanel = ({
  result,
}: {
  result: OrderReportResponseDTO;
}) => {
  const rows = [
    {
      label: 'Gross Sales',
      value: result.data_quality.gross_sales_coverage,
    },
    {
      label: 'Net Sales',
      value: result.data_quality.net_sales_coverage,
    },
    {
      label: 'Net Profit',
      value: result.data_quality.net_profit_coverage,
    },
    {
      label: 'Released Funds',
      value: result.data_quality.released_funds_coverage,
    },
  ];

  return (
    <div className="bg-card rounded-md border">
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Database className="text-muted-foreground size-4" />
          <h2 className="font-medium">Data Confidence</h2>
        </div>
      </div>
      <div className="flex flex-col gap-3 p-4">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                {row.label}
              </span>
              <span
                className={
                  row.value >= 0.9
                    ? 'text-success font-medium'
                    : row.value >= 0.75
                      ? 'text-warning font-medium'
                      : 'text-info font-medium'
                }
              >
                {formatPercent(row.value)}
              </span>
            </div>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className={
                  row.value >= 0.9
                    ? 'bg-success h-full rounded-full'
                    : row.value >= 0.75
                      ? 'bg-warning h-full rounded-full'
                      : 'bg-info h-full rounded-full'
                }
                style={{
                  width: `${Math.min(row.value * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const getFeeRows = (
  breakdown?: OrderReportResponseDTO['fee_breakdown']
) =>
  Object.entries(breakdown || {})
    .map(([key, value]) => ({
      label: key.replace(/_/g, ' '),
      value: Number(value || 0),
    }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);

const formatHighlightValue = (
  row: OrderReportResponseDTO['best_days'][number]
) => {
  if (
    row.metric.includes('sales') ||
    row.metric.includes('profit') ||
    row.metric.includes('fee')
  ) {
    return formatIDR(row.value);
  }

  if (row.metric.includes('margin')) {
    return formatPercent(row.value);
  }

  return formatNumber(row.value);
};

const getRatioTone = (value: number, threshold: number) => {
  if (value >= threshold) return 'bad';
  if (value > 0) return 'good';
  return 'neutral';
};

const formatPercent = (value?: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value || 0);

const formatNumber = (value?: number) =>
  new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 1,
  }).format(value || 0);

const formatShortDate = (date: string) =>
  new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));

export default OrderReportPage;
