'use client';

import { useRef, useState } from 'react';
import {
  ArrowDownUp,
  BadgePercent,
  Boxes,
  type LucideIcon,
  PackageSearch,
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
  const products = result?.products || [];

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

export default ProductsReportPage;
