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
  Ban,
  CircleCheck,
  ClipboardList,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
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
import { OperationReportResponseDTO } from '@/modules/reports/report.dto';
import {
  ReportFormInput,
  ReportFormSchema,
} from '../_components/report.schema';

const statusChartConfig = {
  completed_orders: {
    label: 'Completed',
    color: 'var(--chart-1)',
  },
  cancelled_orders: {
    label: 'Cancelled',
    color: 'var(--chart-2)',
  },
  return_refund_orders: {
    label: 'Return/Refund',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig;

const OperationsReportPage = () => {
  const [result, setResult] =
    useState<OperationReportResponseDTO>();
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
          '/api/v1/dashboard/reports/operations',
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
            'Operation report berhasil dibuat.'
          );
        } else {
          setError(
            data.message ||
              'Terjadi kesalahan saat memproses operation report.'
          );
          toast.error(
            data.message ||
              'Gagal membuat operation report.'
          );
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setError(
            'Terjadi kesalahan teknis. Silakan coba lagi nanti.'
          );
          toast.error('Gagal memproses operation report.');
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
  const statusRows = useMemo(
    () => result?.status_breakdown || [],
    [result?.status_breakdown]
  );
  const dailyReports = useMemo(
    () => result?.daily_reports || [],
    [result?.daily_reports]
  );

  return (
    <div className="bg-background text-foreground min-h-screen w-full overflow-x-hidden">
      <header className="bg-card/80 border-b px-4 py-4 backdrop-blur sm:px-6">
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-md">
              <ClipboardList className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold">
                Operations Report
              </h1>
              <p className="text-muted-foreground line-clamp-2 text-sm">
                Order quality, completion rate,
                cancellation, return, and refund signals.
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
            icon={ShieldCheck}
            label="Completion Rate"
            value={formatPercent(summary?.completion_rate)}
            sub={`${formatNumber(summary?.completed_orders)} completed orders`}
          />
          <MetricCard
            icon={Ban}
            label="Cancellation Rate"
            value={formatPercent(
              summary?.cancellation_rate
            )}
            sub={`${formatIDR(summary?.cancelled_payment || 0)} cancelled value`}
          />
          <MetricCard
            icon={RotateCcw}
            label="Return/Refund Rate"
            value={formatPercent(
              summary?.return_refund_rate
            )}
            sub={`${formatIDR(summary?.return_refund_payment || 0)} affected value`}
          />
          <MetricCard
            icon={AlertTriangle}
            label="Problem Rate"
            value={formatPercent(
              summary?.problem_order_rate
            )}
            sub={`${formatNumber((summary?.cancelled_orders || 0) + (summary?.return_refund_orders || 0))} problem orders`}
          />
        </section>

        <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={ClipboardList}
            label="Total Orders"
            value={formatNumber(summary?.total_orders)}
            sub={formatIDR(summary?.total_payment || 0)}
          />
          <MetricCard
            icon={CircleCheck}
            label="Completed Value"
            value={formatIDR(
              summary?.completed_payment || 0
            )}
            sub={`${formatNumber(summary?.completed_orders)} orders`}
          />
          <MetricCard
            icon={Truck}
            label="In Progress"
            value={formatNumber(
              summary?.in_progress_orders
            )}
            sub="Need operational follow-up"
          />
          <MetricCard
            icon={PackageCheck}
            label="Resolved Ratio"
            value={formatPercent(
              summary?.total_orders
                ? (summary.completed_orders +
                    summary.cancelled_orders +
                    summary.return_refund_orders) /
                    summary.total_orders
                : 0
            )}
            sub="Completed/cancelled/return-refund"
          />
        </section>

        {result ? (
          <section className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
            <div className="bg-card min-w-0 overflow-hidden rounded-md border">
              <div className="border-b px-4 py-3">
                <h2 className="font-medium">
                  Order Quality Trend
                </h2>
                <p className="text-muted-foreground text-sm">
                  Completed, cancelled, and return/refund
                  order count by day.
                </p>
              </div>
              <div className="min-w-0 overflow-hidden p-3">
                <ChartContainer
                  config={statusChartConfig}
                  className="h-56 w-full min-w-0 overflow-hidden sm:h-72"
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
                      interval="preserveStartEnd"
                      tickFormatter={(value) =>
                        String(value).slice(5, 10)
                      }
                    />
                    <YAxis hide />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                    />
                    <Bar
                      dataKey="completed_orders"
                      fill="var(--color-completed_orders)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="cancelled_orders"
                      fill="var(--color-cancelled_orders)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="return_refund_orders"
                      fill="var(--color-return_refund_orders)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>

            <div className="bg-card min-w-0 rounded-md border">
              <div className="border-b px-4 py-3">
                <h2 className="font-medium">
                  Status Funnel
                </h2>
                <p className="text-muted-foreground text-sm">
                  Distribution of all Shopee order statuses.
                </p>
              </div>
              <div className="flex flex-col gap-3 p-4">
                {statusRows.length ? (
                  statusRows.map((row) => (
                    <RatioRow
                      key={row.status}
                      label={row.status.replace(/-/g, ' ')}
                      value={row.orders}
                      ratio={
                        summary?.total_orders
                          ? row.orders /
                            summary.total_orders
                          : 0
                      }
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground text-center text-sm">
                    Belum ada order di periode ini.
                  </p>
                )}
              </div>
            </div>
          </section>
        ) : null}

        <section className="bg-card rounded-md border">
          <div className="flex min-w-0 flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-medium">
                Cancellation Reasons
              </h2>
              <p className="text-muted-foreground text-sm">
                Top cancellation sources and reasons from
                selected period.
              </p>
            </div>
            <Badge variant="outline">
              {formatNumber(
                result?.cancellation_reasons.length
              )}{' '}
              rows
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cancelled By</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">
                    Orders
                  </TableHead>
                  <TableHead className="text-right">
                    Payment Value
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result?.cancellation_reasons.length ? (
                  result.cancellation_reasons.map((row) => (
                    <TableRow
                      key={`${row.cancelled_by}-${row.reason}`}
                    >
                      <TableCell className="capitalize">
                        {row.cancelled_by}
                      </TableCell>
                      <TableCell className="min-w-72">
                        {row.reason}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(row.orders)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatIDR(row.total_payment)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-muted-foreground h-32 text-center text-sm"
                    >
                      Pilih periode atau belum ada order
                      batal.
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
      <span className="text-muted-foreground truncate capitalize">
        {label}
      </span>
      <span className="font-medium">
        {formatNumber(value)} / {formatPercent(ratio)}
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

const formatPercent = (value?: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value || 0);

const formatNumber = (value?: number) =>
  new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 1,
  }).format(value || 0);

export default OperationsReportPage;
