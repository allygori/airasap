'use client';

import { useMemo, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  BadgePercent,
  CircleDollarSign,
  Crown,
  HandCoins,
  ReceiptText,
  ShieldCheck,
  TicketPercent,
  TrendingUp,
  type LucideIcon,
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
import { VoucherReportResponseDTO } from '@/modules/reports/report.dto';
import {
  ReportFormInput,
  ReportFormSchema,
} from '../_components/report.schema';

type VoucherRow =
  VoucherReportResponseDTO['vouchers'][number];

const voucherChartConfig = {
  net_sales: {
    label: 'Net Sales',
    color: 'var(--chart-1)',
  },
  net_profit: {
    label: 'Net Profit',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

const discountChartConfig = {
  seller_discount: {
    label: 'Seller Discount',
    color: 'var(--chart-3)',
  },
  shopee_discount: {
    label: 'Shopee Discount',
    color: 'var(--chart-4)',
  },
} satisfies ChartConfig;

const VouchersReportPage = () => {
  const [result, setResult] =
    useState<VoucherReportResponseDTO>();
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
          '/api/v1/dashboard/reports/vouchers',
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
          toast.success('Voucher report berhasil dibuat.');
        } else {
          setError(
            data.message ||
              'Terjadi kesalahan saat memproses voucher report.'
          );
          toast.error(
            data.message || 'Gagal membuat voucher report.'
          );
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setError(
            'Terjadi kesalahan teknis. Silakan coba lagi nanti.'
          );
          toast.error('Gagal memproses voucher report.');
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
  const vouchers = useMemo(
    () => result?.vouchers || [],
    [result?.vouchers]
  );
  const insights = useMemo(
    () => getVoucherInsights(vouchers),
    [vouchers]
  );

  return (
    <div className="bg-background text-foreground min-h-screen w-full overflow-x-hidden">
      <header className="bg-card/80 border-b px-4 py-4 backdrop-blur sm:px-6">
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-md">
              <TicketPercent className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold">
                Voucher & Campaign Report
              </h1>
              <p className="text-muted-foreground line-clamp-2 text-sm">
                Promo effectiveness, seller discount
                pressure, campaign fee, and voucher margin.
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
            icon={TicketPercent}
            label="Voucher Orders"
            value={formatNumber(summary?.voucher_orders)}
            sub={`${formatPercent(summary?.voucher_order_rate)} of completed orders`}
          />
          <MetricCard
            icon={BadgePercent}
            label="Total Discount"
            value={formatIDR(summary?.total_discount || 0)}
            sub={`${formatPercent(summary?.discount_ratio)} of gross sales`}
          />
          <SignedMetricCard
            icon={CircleDollarSign}
            label="Net Profit"
            value={summary?.total_net_profit || 0}
            sub={`${formatPercent(summary?.net_margin)} net margin`}
          />
          <MetricCard
            icon={ReceiptText}
            label="Voucher Codes"
            value={formatNumber(
              summary?.voucher_codes_count
            )}
            sub={`${formatNumber(summary?.non_voucher_orders)} no-voucher orders`}
          />
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SignedMetricCard
            icon={HandCoins}
            label="Seller Discount"
            value={-1 * (summary?.seller_discount || 0)}
            sub={`${formatPercent(summary?.seller_discount_share)} of discount`}
          />
          <MetricCard
            icon={ShieldCheck}
            label="Shopee Discount"
            value={formatIDR(summary?.shopee_discount || 0)}
            sub="Covered by Shopee"
          />
          <SignedMetricCard
            icon={TrendingUp}
            label="Campaign Fee"
            value={-1 * (summary?.campaign_fee || 0)}
            sub="Campaign-related cost"
          />
          <SignedMetricCard
            icon={BadgePercent}
            label="Affiliate Fee"
            value={-1 * (summary?.affiliate_fee || 0)}
            sub="Affiliate/AMS pressure"
          />
        </section>

        {result ? (
          <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
            <div className="bg-card rounded-md border">
              <div className="border-b px-4 py-3">
                <h2 className="font-medium">
                  Voucher Profitability
                </h2>
                <p className="text-muted-foreground text-sm">
                  Net sales and net profit by voucher or
                  promo bucket.
                </p>
              </div>
              <div className="p-3">
                <ChartContainer
                  config={voucherChartConfig}
                  className="h-72 w-full"
                >
                  <BarChart data={vouchers.slice(0, 10)}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="voucher_code"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis hide />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                    />
                    <Bar
                      dataKey="net_sales"
                      fill="var(--color-net_sales)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="net_profit"
                      fill="var(--color-net_profit)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>

            <div className="bg-card rounded-md border">
              <div className="border-b px-4 py-3">
                <h2 className="font-medium">
                  Promo Decisions
                </h2>
                <p className="text-muted-foreground text-sm">
                  Mana promo yang layak dipertahankan atau
                  diawasi.
                </p>
              </div>
              <div className="grid gap-3 p-3">
                <InsightCard
                  icon={Crown}
                  label="Top Sales"
                  voucher={insights.topSales}
                  value={formatIDR(
                    insights.topSales?.net_sales || 0
                  )}
                />
                <InsightCard
                  icon={CircleDollarSign}
                  label="Top Profit"
                  voucher={insights.topProfit}
                  value={formatIDR(
                    insights.topProfit?.net_profit || 0
                  )}
                />
                <InsightCard
                  icon={AlertTriangle}
                  label="Margin Risk"
                  voucher={insights.marginRisk}
                  value={formatPercent(
                    insights.marginRisk?.net_margin
                  )}
                />
              </div>
            </div>
          </section>
        ) : null}

        {result ? (
          <section className="grid gap-3 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
            <div className="bg-card rounded-md border">
              <div className="border-b px-4 py-3">
                <h2 className="font-medium">
                  Discount Split
                </h2>
                <p className="text-muted-foreground text-sm">
                  Seller vs Shopee discount contribution.
                </p>
              </div>
              <div className="space-y-4 p-4">
                <RatioRow
                  label="Seller Discount"
                  value={summary?.seller_discount || 0}
                  ratio={
                    summary?.seller_discount_share || 0
                  }
                />
                <RatioRow
                  label="Shopee Discount"
                  value={summary?.shopee_discount || 0}
                  ratio={
                    1 -
                    (summary?.seller_discount_share || 0)
                  }
                />
              </div>
            </div>

            <div className="bg-card rounded-md border">
              <div className="border-b px-4 py-3">
                <h2 className="font-medium">
                  Discount Pressure
                </h2>
                <p className="text-muted-foreground text-sm">
                  Highest discount buckets by voucher.
                </p>
              </div>
              <div className="p-3">
                <ChartContainer
                  config={discountChartConfig}
                  className="h-72 w-full"
                >
                  <BarChart data={vouchers.slice(0, 10)}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="voucher_code"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis hide />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                    />
                    <Bar
                      dataKey="seller_discount"
                      fill="var(--color-seller_discount)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="shopee_discount"
                      fill="var(--color-shopee_discount)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          </section>
        ) : null}

        <section className="bg-card rounded-md border">
          <div className="flex min-w-0 flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-medium">
                Voucher Performance
              </h2>
              <p className="text-muted-foreground text-sm">
                One row per voucher code or promo bucket.
              </p>
            </div>
            <Badge variant="outline">
              {formatNumber(vouchers.length)} rows
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Voucher</TableHead>
                  <TableHead className="text-right">
                    Orders
                  </TableHead>
                  <TableHead className="text-right">
                    Buyers
                  </TableHead>
                  <TableHead className="text-right">
                    Net Sales
                  </TableHead>
                  <TableHead className="text-right">
                    Discount
                  </TableHead>
                  <TableHead className="text-right">
                    Net Profit
                  </TableHead>
                  <TableHead className="text-right">
                    Margin
                  </TableHead>
                  <TableHead>Class</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.length ? (
                  vouchers.map((voucher) => (
                    <TableRow key={voucher.voucher_code}>
                      <TableCell className="min-w-52 font-medium">
                        {voucher.voucher_code}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(voucher.orders)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(voucher.buyers)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatIDR(voucher.net_sales)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatIDR(voucher.total_discount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <FinancialDisplay
                            value={voucher.net_profit}
                            formatter={formatIDR}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <FinancialDisplay
                            value={voucher.net_margin}
                            formatter={formatPercent}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getVoucherVariant(
                            voucher.classification
                          )}
                        >
                          {voucher.classification}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-muted-foreground h-32 text-center text-sm"
                    >
                      Pilih periode untuk membuat voucher
                      report.
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
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
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
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  sub: string;
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
          className="truncate text-lg font-semibold"
        />
        <p className="text-muted-foreground truncate text-xs">
          {sub}
        </p>
      </div>
    </CardContent>
  </Card>
);

const InsightCard = ({
  icon: Icon,
  label,
  voucher,
  value,
}: {
  icon: LucideIcon;
  label: string;
  voucher?: VoucherRow;
  value: string;
}) => (
  <div className="bg-background rounded-md border p-3">
    <div className="mb-3 flex items-center gap-2">
      <Icon className="text-muted-foreground size-4" />
      <p className="text-muted-foreground text-xs font-medium uppercase">
        {label}
      </p>
    </div>
    <p className="truncate font-medium">
      {voucher?.voucher_code || '-'}
    </p>
    <p className="text-muted-foreground truncate text-xs">
      {voucher
        ? `${formatNumber(voucher.orders)} orders / ${formatPercent(voucher.discount_ratio)} discount`
        : '-'}
    </p>
    <p className="mt-3 text-lg font-semibold">{value}</p>
  </div>
);

const RatioRow = ({
  label,
  value,
  ratio,
}: {
  label: string;
  value: number;
  ratio: number;
}) => (
  <div>
    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">
        {formatIDR(value)} / {formatPercent(ratio)}
      </span>
    </div>
    <div className="bg-muted h-2 overflow-hidden rounded-full">
      <div
        className="bg-primary h-full rounded-full"
        style={{ width: `${Math.min(ratio * 100, 100)}%` }}
      />
    </div>
  </div>
);

const getVoucherInsights = (vouchers: VoucherRow[]) => ({
  topSales: [...vouchers].sort(
    (a, b) => b.net_sales - a.net_sales
  )[0],
  topProfit: [...vouchers].sort(
    (a, b) => b.net_profit - a.net_profit
  )[0],
  marginRisk: [...vouchers]
    .filter((voucher) => voucher.net_sales > 0)
    .sort(
      (a, b) =>
        a.net_margin - b.net_margin ||
        b.net_sales - a.net_sales
    )[0],
});

const getVoucherVariant = (
  classification: VoucherRow['classification']
) => {
  if (classification === 'Profitable') return 'default';
  if (classification === 'Growth Driver')
    return 'secondary';
  if (classification === 'Margin Risk')
    return 'destructive';
  return 'outline';
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

export default VouchersReportPage;
