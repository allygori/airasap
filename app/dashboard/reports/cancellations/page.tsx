'use client';

import { useRef, useState } from 'react';
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
  Ban,
  CircleDollarSign,
  ClipboardList,
  PackageX,
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
import {
  CancellationReportResponseDTO,
  CreateReportDTO,
} from '@/modules/reports/report.dto';
import {
  ReportFormInput,
  ReportFormSchema,
} from '../_components/report.schema';

const trendConfig = {
  potential_gross_sales: {
    label: 'Potential Sales',
    color: 'var(--color-info)',
  },
  cancelled_gross_sales: {
    label: 'Cancelled Sales',
    color: 'var(--color-danger)',
  },
} satisfies ChartConfig;

const actorConfig = {
  cancelled_gross_sales: {
    label: 'Cancelled Sales',
    color: 'var(--color-danger)',
  },
} satisfies ChartConfig;

const reasonConfig = {
  cancelled_gross_sales: {
    label: 'Cancelled Sales',
    color: 'var(--color-danger)',
  },
} satisfies ChartConfig;

const CancellationReportPage = () => {
  const [result, setResult] =
    useState<CancellationReportResponseDTO>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(
    null
  );

  const form = useAppForm({
    defaultValues: {
      date: { from: '', to: '' },
    } as ReportFormInput,
    validators: { onDynamic: ReportFormSchema },
    onSubmit: async ({ value }) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          '/api/v1/dashboard/reports/cancellations',
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
        if (!response.ok || !data.success)
          throw new Error(
            data.message ||
              'Gagal membuat cancellation report.'
          );
        setResult(data.data);
        toast.success(
          'Cancellation report berhasil dibuat.'
        );
      } catch (caught) {
        if ((caught as Error).name !== 'AbortError') {
          setError(
            (caught as Error).message ||
              'Terjadi kesalahan teknis.'
          );
          toast.error(
            'Gagal memproses cancellation report.'
          );
        }
      } finally {
        if (abortControllerRef.current === controller)
          abortControllerRef.current = null;
        setIsLoading(false);
      }
    },
  });

  const summary = result?.summary;
  return (
    <div className="bg-background text-foreground min-h-screen w-full overflow-x-hidden">
      <header className="bg-card/80 border-b px-4 py-4 backdrop-blur sm:px-6">
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="bg-danger/10 text-danger flex size-10 shrink-0 items-center justify-center rounded-md">
              <Ban className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold">
                Cancellation Report
              </h1>
              <p className="text-muted-foreground line-clamp-2 text-sm">
                Cancellation volume, potential sales lost,
                and root causes.
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
        <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            icon={ClipboardList}
            label="All Orders"
            value={formatNumber(summary?.total_orders)}
            sub={formatIDR(
              summary?.potential_gross_sales || 0
            )}
          />
          <MetricCard
            icon={Ban}
            label="Cancelled Orders"
            value={formatNumber(summary?.cancelled_orders)}
            sub={formatPercent(
              summary?.cancellation_rate_by_orders
            )}
            danger
          />
          <MetricCard
            icon={CircleDollarSign}
            label="Potential Sales Lost"
            value={formatIDR(
              summary?.cancelled_gross_sales || 0
            )}
            sub={formatPercent(
              summary?.cancellation_rate_by_value
            )}
            danger
          />
          <MetricCard
            icon={PackageX}
            label="Cancelled Payment"
            value={formatIDR(
              summary?.cancelled_payment || 0
            )}
            sub={`${formatNumber(summary?.cancelled_units)} units`}
          />
          <MetricCard
            icon={AlertTriangle}
            label="Avg Cancelled Order"
            value={formatIDR(
              summary?.average_cancelled_order_value || 0
            )}
            sub="per cancelled order"
            warning
          />
        </section>

        {result ? (
          <>
            <section className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
              <Panel
                title="Cancellation Trend"
                description="Potential sales and cancelled sales by local store date."
              >
                <ChartContainer
                  config={trendConfig}
                  className="h-64 w-full min-w-0"
                >
                  <AreaChart data={result.daily_reports}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) =>
                        String(value).slice(5)
                      }
                    />
                    <YAxis hide />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                    />
                    <Area
                      dataKey="potential_gross_sales"
                      type="monotone"
                      fill="var(--color-potential_gross_sales)"
                      fillOpacity={0.12}
                      stroke="var(--color-potential_gross_sales)"
                    />
                    <Area
                      dataKey="cancelled_gross_sales"
                      type="monotone"
                      fill="var(--color-cancelled_gross_sales)"
                      fillOpacity={0.24}
                      stroke="var(--color-cancelled_gross_sales)"
                    />
                  </AreaChart>
                </ChartContainer>
              </Panel>
              <Panel
                title="Loss Summary"
                description="Financial impact attached to cancelled orders."
              >
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  <Stat
                    label="Cancelled COGS"
                    value={formatIDR(
                      summary?.cancelled_cogs || 0
                    )}
                  />
                  <Stat
                    label="Estimated Gross Profit"
                    value={formatIDR(
                      summary?.cancelled_gross_profit || 0
                    )}
                  />
                  <Stat
                    label="Estimated Net Profit"
                    value={formatIDR(
                      summary?.cancelled_net_profit || 0
                    )}
                  />
                  <Stat
                    label="Seller Discount"
                    value={formatIDR(
                      summary?.cancelled_seller_discount ||
                        0
                    )}
                  />
                  <Stat
                    label="Shopee Discount"
                    value={formatIDR(
                      summary?.cancelled_shopee_discount ||
                        0
                    )}
                  />
                </div>
              </Panel>
            </section>
            <section className="grid min-w-0 gap-3 xl:grid-cols-2">
              <BreakdownTable
                title="Cancelled By"
                rows={result.cancellation_by_actor}
                config={actorConfig}
              />
              <BreakdownTable
                title="Cancellation Reasons"
                rows={result.cancellation_by_reason}
                config={reasonConfig}
              />
            </section>
            <Panel
              title="Data Confidence"
              description="Coverage of fields used for cancellation analysis."
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <Confidence
                  label="Gross sales"
                  value={
                    result.data_quality.gross_sales_coverage
                  }
                />
                <Confidence
                  label="Cancellation actor"
                  value={result.data_quality.actor_coverage}
                />
                <Confidence
                  label="Cancellation reason"
                  value={
                    result.data_quality.reason_coverage
                  }
                />
              </div>
            </Panel>
          </>
        ) : (
          <div className="border-muted-foreground/25 text-muted-foreground rounded-md border border-dashed px-4 py-16 text-center text-sm">
            Pilih periode untuk membuat cancellation report.
          </div>
        )}
      </main>
    </div>
  );
};

const Panel = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="bg-card min-w-0 rounded-md border">
    <div className="border-b px-4 py-3">
      <h2 className="font-medium">{title}</h2>
      <p className="text-muted-foreground text-sm">
        {description}
      </p>
    </div>
    <div className="min-w-0 p-3">{children}</div>
  </div>
);

const MetricCard = ({
  icon: Icon,
  label,
  value,
  sub,
  danger,
  warning,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
  danger?: boolean;
  warning?: boolean;
}) => (
  <Card className="bg-card rounded-md">
    <CardContent className="flex items-center gap-3">
      <div
        className={`${danger ? 'bg-danger/10 text-danger' : warning ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'} flex size-9 shrink-0 items-center justify-center rounded-md`}
      >
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

const BreakdownTable = ({
  title,
  rows,
  config,
}: {
  title: string;
  rows: CancellationReportResponseDTO['cancellation_by_actor'];
  config?: ChartConfig;
}) => (
  <Panel
    title={title}
    description="Cancelled orders ranked by gross sales value."
  >
    <div className="mb-3 h-40">
      {config ? (
        <ChartContainer
          config={config}
          className="h-full w-full"
        >
          <BarChart data={rows}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" hide />
            <YAxis hide />
            <Bar
              dataKey="cancelled_gross_sales"
              fill="var(--color-cancelled_gross_sales)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      ) : null}
    </div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Label</TableHead>
          <TableHead className="text-right">
            Orders
          </TableHead>
          <TableHead className="text-right">
            Gross Sales
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length ? (
          rows.map((row) => (
            <TableRow key={row.label}>
              <TableCell className="max-w-72 truncate">
                {row.label}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.orders)}
              </TableCell>
              <TableCell className="text-right">
                {formatIDR(row.cancelled_gross_sales)}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={3}
              className="text-muted-foreground h-24 text-center"
            >
              Belum ada data.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </Panel>
);

const Stat = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="bg-background rounded-md border px-3 py-2">
    <p className="text-muted-foreground text-xs">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
);
const Confidence = ({
  label,
  value,
}: {
  label: string;
  value: number;
}) => (
  <div>
    <div className="mb-1 flex justify-between text-sm">
      <span>{label}</span>
      <Badge variant={value < 0.9 ? 'warning' : 'success'}>
        {formatPercent(value)}
      </Badge>
    </div>
    <div className="bg-muted h-2 rounded-full">
      <div
        className="bg-info h-full rounded-full"
        style={{ width: `${Math.min(value * 100, 100)}%` }}
      />
    </div>
  </div>
);
const formatNumber = (value?: number) =>
  new Intl.NumberFormat('id-ID').format(value || 0);
const formatPercent = (value?: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value || 0);

export default CancellationReportPage;
