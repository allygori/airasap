'use client';

import { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownUp,
  BadgePercent,
  Boxes,
  CircleDollarSign,
  Crown,
  Database,
  type LucideIcon,
  PackageSearch,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAppForm } from '@/components/form/form.hook';
import { formatIDR } from '@/lib/formatter/format-idr';
import { ProductAnalyticsResponseDTO } from '@/modules/reports/report.dto';
import {
  ReportFormInput,
  ReportFormSchema,
} from '../_components/report.schema';

type ProductRow =
  ProductAnalyticsResponseDTO['products'][number];

const formatPercent = (value?: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value || 0);

const formatNumber = (value?: number) =>
  new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 1,
  }).format(value || 0);

const classificationVariant = (
  classification: ProductRow['classification']
) => {
  if (classification === 'Star') return 'default';
  if (classification === 'Revenue Driver')
    return 'secondary';
  if (classification === 'Profit Driver') return 'outline';
  return 'destructive';
};

const ProductsReportPage = () => {
  const [result, setResult] =
    useState<ProductAnalyticsResponseDTO>();
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
          '/api/v1/dashboard/reports/products',
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
          toast.success('Laporan produk berhasil dibuat.');
        } else {
          setError(
            data.message ||
              'Terjadi kesalahan saat memproses laporan produk.'
          );
          toast.error(
            data.message || 'Gagal membuat laporan produk.'
          );
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setError(
            'Terjadi kesalahan teknis. Silakan coba lagi nanti.'
          );
          toast.error('Gagal memproses laporan produk.');
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
  const products = useMemo(
    () => result?.products || [],
    [result?.products]
  );
  const insights = useMemo(
    () => getProductInsights(products),
    [products]
  );

  return (
    <div className="bg-background text-foreground min-h-screen w-full overflow-x-hidden">
      <header className="bg-card/80 border-b px-4 py-4 backdrop-blur sm:px-6">
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-md">
              <PackageSearch className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold">
                Product Sales Report
              </h1>
              <p className="text-muted-foreground line-clamp-2 text-sm">
                Revenue, profit, contribution, and velocity
                by SKU.
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
            sub={`${formatPercent(summary?.gross_margin)} gross margin`}
          />
          <MetricCard
            icon={BadgePercent}
            label="Net Profit"
            value={formatIDR(summary?.net_profit || 0)}
            sub={`${formatPercent(summary?.net_margin)} net margin`}
          />
          <MetricCard
            icon={Boxes}
            label="Units Sold"
            value={formatNumber(summary?.total_units)}
            sub={`${formatNumber(summary?.total_orders)} product orders`}
          />
          <MetricCard
            icon={ArrowDownUp}
            label="COGS + Deductions"
            value={formatIDR(
              (summary?.cogs || 0) +
                (summary?.marketplace_deduction || 0)
            )}
            sub={`${formatIDR(summary?.cogs || 0)} COGS`}
          />
        </section>

        {products.length ? (
          <section className="grid gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
            <div className="bg-card rounded-md border">
              <div className="border-b px-4 py-3">
                <h2 className="font-medium">
                  Product Decisions
                </h2>
                <p className="text-muted-foreground text-sm">
                  Produk yang paling layak diprioritaskan
                  dari sisi sales, profit, dan risiko
                  margin.
                </p>
              </div>
              <div className="grid gap-3 p-3 md:grid-cols-2">
                <InsightCard
                  icon={Crown}
                  label="Top Sales"
                  product={insights.topSales}
                  value={
                    insights.topSales
                      ? formatIDR(
                          insights.topSales.net_sales
                        )
                      : '-'
                  }
                  sub={
                    insights.topSales
                      ? `${formatPercent(
                          insights.topSales
                            .sales_contribution
                        )} of net sales`
                      : 'Belum ada data'
                  }
                />
                <InsightCard
                  icon={CircleDollarSign}
                  label="Top Profit"
                  product={insights.topProfit}
                  value={
                    insights.topProfit
                      ? formatIDR(
                          insights.topProfit.net_profit
                        )
                      : '-'
                  }
                  sub={
                    insights.topProfit
                      ? `${formatPercent(
                          insights.topProfit.net_margin
                        )} net margin`
                      : 'Belum ada data'
                  }
                />
                <InsightCard
                  icon={AlertTriangle}
                  label="Margin Watch"
                  product={insights.marginWatch}
                  value={
                    insights.marginWatch
                      ? formatPercent(
                          insights.marginWatch.net_margin
                        )
                      : '-'
                  }
                  sub={
                    insights.marginWatch
                      ? `${formatIDR(
                          insights.marginWatch.net_sales
                        )} net sales`
                      : 'Tidak ada kandidat'
                  }
                />
                <InsightCard
                  icon={BadgePercent}
                  label="Weak Performer"
                  product={insights.weakest}
                  value={
                    insights.weakest
                      ? formatIDR(
                          insights.weakest.net_profit
                        )
                      : '-'
                  }
                  sub={
                    insights.weakest
                      ? `${formatNumber(
                          insights.weakest.units
                        )} units sold`
                      : 'Tidak ada kandidat'
                  }
                />
              </div>
            </div>

            <div className="bg-card rounded-md border">
              <div className="border-b px-4 py-3">
                <h2 className="font-medium">
                  Sales Concentration
                </h2>
                <p className="text-muted-foreground text-sm">
                  Ketergantungan omzet pada produk teratas.
                </p>
              </div>
              <div className="space-y-4 p-4">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">
                      Top 5 net sales share
                    </span>
                    <span className="font-medium">
                      {formatPercent(
                        insights.topFiveSalesContribution
                      )}
                    </span>
                  </div>
                  <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{
                        width: `${Math.min(
                          insights.topFiveSalesContribution *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MiniStat
                    label="Stars"
                    value={formatNumber(insights.stars)}
                  />
                  <MiniStat
                    label="Weak"
                    value={formatNumber(insights.weak)}
                  />
                  <MiniStat
                    label="Profit drivers"
                    value={formatNumber(
                      insights.profitDrivers
                    )}
                  />
                  <MiniStat
                    label="Revenue drivers"
                    value={formatNumber(
                      insights.revenueDrivers
                    )}
                  />
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {summary ? (
          <section className="bg-card rounded-md border">
            <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
              <div className="flex min-w-0 items-start gap-3">
                <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-md">
                  <ShieldCheck className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium">
                      Data Confidence
                    </h2>
                    <Badge variant="outline">
                      {getQualityLabel(
                        summary.data_quality_score
                      )}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Kualitas metrik berdasarkan jumlah item
                    yang sudah memakai field financial
                    kanonik.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <QualityMetric
                  icon={Database}
                  label="Tracked Items"
                  value={formatNumber(summary.total_items)}
                  sub={`${formatNumber(
                    summary.total_products
                  )} product rows`}
                />
                <QualityMetric
                  icon={TrendingUp}
                  label="Net Sales Source"
                  value={formatPercent(
                    summary.canonical_net_sales_rate
                  )}
                  sub={`${formatNumber(
                    summary.items_with_stored_net_sales
                  )} canonical items`}
                />
                <QualityMetric
                  icon={CircleDollarSign}
                  label="Net Profit Source"
                  value={formatPercent(
                    summary.canonical_net_profit_rate
                  )}
                  sub={`${formatNumber(
                    summary.items_with_stored_net_profit
                  )} canonical items`}
                />
              </div>
            </div>
            <div className="border-t px-4 py-3">
              <QualityBar
                value={summary.data_quality_score}
              />
            </div>
          </section>
        ) : null}

        <section className="bg-card rounded-md border">
          <div className="flex min-w-0 flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-medium">
                Product Performance
              </h2>
              <p className="text-muted-foreground text-sm">
                One row per product variation in the
                selected range.
              </p>
            </div>
            <Badge variant="outline">
              {formatNumber(products.length)} rows
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">
                    Units
                  </TableHead>
                  <TableHead className="text-right">
                    Orders
                  </TableHead>
                  <TableHead className="text-right">
                    Net Sales
                  </TableHead>
                  <TableHead className="text-right">
                    Net Profit
                  </TableHead>
                  <TableHead className="text-right">
                    Margin
                  </TableHead>
                  <TableHead className="text-right">
                    Contribution
                  </TableHead>
                  <TableHead>Class</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length ? (
                  products.map((product) => (
                    <ProductTableRow
                      key={`${product.product_id}-${product.variation_id}`}
                      product={product}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-muted-foreground h-32 text-center text-sm"
                    >
                      Pilih periode untuk membuat laporan
                      produk.
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

const InsightCard = ({
  icon: Icon,
  label,
  product,
  value,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  product?: ProductRow;
  value: string;
  sub: string;
}) => (
  <div className="bg-background rounded-md border p-3">
    <div className="mb-3 flex items-center gap-2">
      <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
        <Icon className="size-4" />
      </div>
      <p className="text-muted-foreground text-xs font-medium uppercase">
        {label}
      </p>
    </div>
    <p className="line-clamp-2 min-h-10 text-sm font-medium">
      {product?.product_name || 'Belum ada produk'}
    </p>
    <p className="text-muted-foreground truncate text-xs">
      {product
        ? `${product.variation_name || 'Default'} / ${
            product.child_sku || product.parent_sku || '-'
          }`
        : '-'}
    </p>
    <div className="mt-3 flex items-end justify-between gap-3">
      <p className="truncate text-base font-semibold">
        {value}
      </p>
      <Badge variant={product ? 'outline' : 'secondary'}>
        {sub}
      </Badge>
    </div>
  </div>
);

const MiniStat = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="bg-background rounded-md border px-3 py-2">
    <p className="text-muted-foreground text-xs">{label}</p>
    <p className="text-lg font-semibold">{value}</p>
  </div>
);

const QualityMetric = ({
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
  <div className="bg-background rounded-md border px-3 py-2">
    <div className="mb-2 flex items-center gap-2">
      <Icon className="text-muted-foreground size-4" />
      <p className="text-muted-foreground truncate text-xs font-medium uppercase">
        {label}
      </p>
    </div>
    <p className="truncate text-lg font-semibold">
      {value}
    </p>
    <p className="text-muted-foreground truncate text-xs">
      {sub}
    </p>
  </div>
);

const QualityBar = ({ value }: { value: number }) => (
  <div>
    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">
        Canonical financial coverage
      </span>
      <span className="font-medium">
        {formatPercent(value)}
      </span>
    </div>
    <div className="bg-muted h-2 overflow-hidden rounded-full">
      <div
        className="bg-primary h-full rounded-full"
        style={{
          width: `${Math.min(value * 100, 100)}%`,
        }}
      />
    </div>
  </div>
);

const ProductTableRow = ({
  product,
}: {
  product: ProductRow;
}) => (
  <TableRow>
    <TableCell className="max-w-[28rem] min-w-72">
      <div className="flex flex-col">
        <span className="truncate font-medium">
          {product.product_name}
        </span>
        <span className="text-muted-foreground truncate text-xs">
          {product.variation_name || 'Default'} /{' '}
          {product.child_sku || product.parent_sku || '-'}
        </span>
      </div>
    </TableCell>
    <TableCell className="text-right">
      {formatNumber(product.units)}
    </TableCell>
    <TableCell className="text-right">
      {formatNumber(product.orders)}
    </TableCell>
    <TableCell className="text-right">
      {formatIDR(product.net_sales)}
    </TableCell>
    <TableCell className="text-right">
      {formatIDR(product.net_profit)}
    </TableCell>
    <TableCell className="text-right">
      {formatPercent(product.net_margin)}
    </TableCell>
    <TableCell className="text-right">
      {formatPercent(product.sales_contribution)}
    </TableCell>
    <TableCell>
      <Badge
        variant={classificationVariant(
          product.classification
        )}
      >
        {product.classification}
      </Badge>
    </TableCell>
  </TableRow>
);

const getProductInsights = (products: ProductRow[]) => {
  const byNetSales = [...products].sort(
    (a, b) => b.net_sales - a.net_sales
  );
  const byNetProfit = [...products].sort(
    (a, b) => b.net_profit - a.net_profit
  );
  const marginCandidates = byNetSales
    .filter((product) => product.net_sales > 0)
    .slice(0, 10)
    .sort((a, b) => a.net_margin - b.net_margin);
  const weakCandidates = products
    .filter(
      (product) =>
        product.classification === 'Weak' ||
        product.net_profit <= 0
    )
    .sort(
      (a, b) =>
        a.net_profit - b.net_profit ||
        b.net_sales - a.net_sales
    );
  const topFiveSalesContribution = byNetSales
    .slice(0, 5)
    .reduce(
      (total, product) =>
        total + product.sales_contribution,
      0
    );

  return {
    topSales: byNetSales[0],
    topProfit: byNetProfit[0],
    marginWatch: marginCandidates[0],
    weakest: weakCandidates[0],
    topFiveSalesContribution,
    stars: products.filter(
      (product) => product.classification === 'Star'
    ).length,
    weak: products.filter(
      (product) => product.classification === 'Weak'
    ).length,
    profitDrivers: products.filter(
      (product) =>
        product.classification === 'Profit Driver'
    ).length,
    revenueDrivers: products.filter(
      (product) =>
        product.classification === 'Revenue Driver'
    ).length,
  };
};

const getQualityLabel = (score: number) => {
  if (score >= 0.95) return 'High confidence';
  if (score >= 0.75) return 'Good coverage';
  if (score >= 0.5) return 'Mixed sources';
  return 'Needs re-enrich';
};

export default ProductsReportPage;
