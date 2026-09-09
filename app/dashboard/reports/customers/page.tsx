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
  Crown,
  HandCoins,
  MoveRight,
  Repeat2,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  UsersRound,
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
import { CustomerReportResponseDTO } from '@/modules/reports/report.dto';
import {
  ReportFormInput,
  ReportFormSchema,
} from '../_components/report.schema';

type CustomerRow =
  CustomerReportResponseDTO['customers'][number];

const repeatChartConfig = {
  customers: {
    label: 'Customers',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

const CustomersReportPage = () => {
  const [result, setResult] =
    useState<CustomerReportResponseDTO>();
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
          '/api/v1/dashboard/reports/customers',
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
          toast.success('Customer report berhasil dibuat.');
        } else {
          setError(
            data.message ||
              'Terjadi kesalahan saat memproses customer report.'
          );
          toast.error(
            data.message || 'Gagal membuat customer report.'
          );
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setError(
            'Terjadi kesalahan teknis. Silakan coba lagi nanti.'
          );
          toast.error('Gagal memproses customer report.');
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
  const customers = useMemo(
    () => result?.customers || [],
    [result?.customers]
  );
  const insights = useMemo(
    () => getCustomerInsights(customers),
    [customers]
  );

  return (
    <div className="bg-background text-foreground min-h-screen w-full overflow-x-hidden">
      <header className="bg-card/80 border-b px-4 py-4 backdrop-blur sm:px-6">
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-md">
              <UsersRound className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold">
                Customer Report
              </h1>
              <p className="text-muted-foreground line-clamp-2 text-sm">
                Repeat order, customer value, and buyer
                quality from completed Shopee orders.
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
            icon={UsersRound}
            label="Customers"
            value={formatNumber(summary?.total_customers)}
            sub={`${formatNumber(summary?.new_customers)} new customers`}
          />
          <MetricCard
            icon={Repeat2}
            label="Repeat Rate"
            value={formatPercent(
              summary?.repeat_customer_rate
            )}
            sub={`${formatNumber(summary?.repeat_customers)} repeat customers`}
          />
          <MetricCard
            icon={MoveRight}
            label="Returning Rate"
            value={formatPercent(
              summary?.returning_customer_rate
            )}
            sub={`${formatNumber(summary?.returning_customers)} returning buyers`}
          />
          <MetricCard
            icon={ShoppingBag}
            label="Orders / Customer"
            value={formatNumber(
              summary?.average_orders_per_customer
            )}
            sub={`${formatNumber(summary?.total_orders)} completed orders`}
          />
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={TrendingUp}
            label="Net Sales / Customer"
            value={formatIDR(
              summary?.average_net_sales_per_customer || 0
            )}
            sub={formatIDR(summary?.total_net_sales || 0)}
          />
          <SignedMetricCard
            icon={HandCoins}
            label="Profit / Customer"
            value={
              summary?.average_net_profit_per_customer || 0
            }
            sub={formatIDR(summary?.total_net_profit || 0)}
          />
          <MetricCard
            icon={ShieldCheck}
            label="Days to 2nd Order"
            value={formatNumber(
              summary?.average_days_to_second_order
            )}
            sub="Average repeat interval"
          />
          <MetricCard
            icon={Crown}
            label="Top Customer Value"
            value={formatIDR(
              insights.topValue?.period_net_sales || 0
            )}
            sub={insights.topValue?.username || '-'}
          />
        </section>

        {result ? (
          <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
            <div className="bg-card rounded-md border">
              <div className="border-b px-4 py-3">
                <h2 className="font-medium">
                  Repeat Order Interval
                </h2>
                <p className="text-muted-foreground text-sm">
                  Jarak dari order pertama ke order kedua.
                </p>
              </div>
              <div className="p-3">
                <ChartContainer
                  config={repeatChartConfig}
                  className="h-72 w-full"
                >
                  <BarChart
                    data={result.repeat_interval_buckets}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="bucket"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis hide />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                    />
                    <Bar
                      dataKey="customers"
                      fill="var(--color-customers)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>

            <div className="bg-card rounded-md border">
              <div className="border-b px-4 py-3">
                <h2 className="font-medium">
                  Customer Decisions
                </h2>
                <p className="text-muted-foreground text-sm">
                  Customer yang paling layak dipahami pola
                  belanjanya.
                </p>
              </div>
              <div className="grid gap-3 p-3">
                <InsightCard
                  label="Highest Sales"
                  customer={insights.topValue}
                  value={formatIDR(
                    insights.topValue?.period_net_sales || 0
                  )}
                />
                <InsightCard
                  label="Highest Profit"
                  customer={insights.topProfit}
                  value={formatIDR(
                    insights.topProfit?.period_net_profit ||
                      0
                  )}
                />
                <InsightCard
                  label="Most Repeat"
                  customer={insights.mostRepeat}
                  value={`${formatNumber(
                    insights.mostRepeat?.period_orders
                  )} orders`}
                />
              </div>
            </div>
          </section>
        ) : null}

        <section className="bg-card rounded-md border">
          <div className="flex min-w-0 flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-medium">
                Customer Value Table
              </h2>
              <p className="text-muted-foreground text-sm">
                Top customers in the selected period, ranked
                by profit and sales.
              </p>
            </div>
            <Badge variant="outline">
              {formatNumber(customers.length)} rows
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">
                    Period Orders
                  </TableHead>
                  <TableHead className="text-right">
                    Lifetime Orders
                  </TableHead>
                  <TableHead className="text-right">
                    Net Sales
                  </TableHead>
                  <TableHead className="text-right">
                    Net Profit
                  </TableHead>
                  <TableHead className="text-right">
                    AOV
                  </TableHead>
                  <TableHead className="text-right">
                    Margin
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length ? (
                  customers.map((customer) => (
                    <TableRow key={customer.customer_key}>
                      <TableCell className="min-w-52">
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-medium">
                            {customer.username}
                          </span>
                          <span className="text-muted-foreground truncate text-xs">
                            First order:{' '}
                            {formatShortDate(
                              customer.first_order_at
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(
                          customer.period_orders
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(
                          customer.lifetime_orders
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatIDR(
                          customer.period_net_sales
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <FinancialDisplay
                            value={
                              customer.period_net_profit
                            }
                            formatter={formatIDR}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatIDR(
                          customer.average_order_value
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <FinancialDisplay
                            value={customer.net_margin}
                            formatter={formatPercent}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <CustomerBadge
                          customer={customer}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-muted-foreground h-32 text-center text-sm"
                    >
                      Pilih periode untuk membuat customer
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
  label,
  customer,
  value,
}: {
  label: string;
  customer?: CustomerRow;
  value: string;
}) => (
  <div className="bg-background rounded-md border p-3">
    <p className="text-muted-foreground text-xs font-medium uppercase">
      {label}
    </p>
    <p className="mt-2 truncate font-medium">
      {customer?.username || '-'}
    </p>
    <p className="text-muted-foreground truncate text-xs">
      {customer
        ? `${formatNumber(customer.period_orders)} period orders / ${formatNumber(customer.lifetime_orders)} lifetime`
        : '-'}
    </p>
    <p className="mt-3 text-lg font-semibold">{value}</p>
  </div>
);

const CustomerBadge = ({
  customer,
}: {
  customer: CustomerRow;
}) => {
  if (customer.is_returning_customer) {
    return <Badge variant="default">Returning</Badge>;
  }
  if (customer.is_repeat_customer) {
    return <Badge variant="secondary">Repeat</Badge>;
  }
  if (customer.is_new_customer) {
    return <Badge variant="outline">New</Badge>;
  }

  return <Badge variant="outline">Single</Badge>;
};

const getCustomerInsights = (customers: CustomerRow[]) => ({
  topValue: [...customers].sort(
    (a, b) => b.period_net_sales - a.period_net_sales
  )[0],
  topProfit: [...customers].sort(
    (a, b) => b.period_net_profit - a.period_net_profit
  )[0],
  mostRepeat: [...customers].sort(
    (a, b) =>
      b.period_orders - a.period_orders ||
      b.period_net_sales - a.period_net_sales
  )[0],
});

const formatPercent = (value?: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value || 0);

const formatNumber = (value?: number) =>
  new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 1,
  }).format(value || 0);

const formatShortDate = (date: string | Date) =>
  new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));

export default CustomersReportPage;
