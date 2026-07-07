'use client';

import { TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { SalesReportResponseDTO } from '@/modules/reports/report.dto';
import { useMemo } from 'react';
import { formatDate } from '@/lib/formatter/date';

export const description =
  'A stacked bar chart with a legend';

// const chartData = [
//   { month: 'January', desktop: 186, mobile: 80 },
//   { month: 'February', desktop: 305, mobile: 200 },
//   { month: 'March', desktop: 237, mobile: 120 },
//   { month: 'April', desktop: 73, mobile: 190 },
//   { month: 'May', desktop: 209, mobile: 130 },
//   { month: 'June', desktop: 214, mobile: 140 },
// ];

const chartConfig = {
  confirmed: {
    label: 'Terkonfirmasi',
    color: 'var(--chart-1)',
    // color: 'var(--color-green-400)',
  },
  cancelled: {
    label: 'Dibatalkan',
    color: 'var(--destructive)',
  },
} satisfies ChartConfig;

type ChartData = {
  date: Date | string;
  confirmed: number;
  cancelled: number;
};
type Order = SalesReportResponseDTO['daily_reports'][0];
type ChartBarStackedOrderTrends = {
  orders: Order[];
};

export const ChartBarStackedOrderTrends = ({
  orders,
}: ChartBarStackedOrderTrends) => {
  const orderData = useMemo(() => {
    let _orderData: ChartData[] = [];
    const year = orders[0]?.year;
    const month = orders[0]?.month;

    if (year && month) {
      const daysInMonth = new Date(
        year,
        month,
        0
      ).getDate();

      const fullMonth = Array.from(
        { length: daysInMonth },
        (_, i) => i + 1
      );

      _orderData = fullMonth.map((day) => {
        const existing = orders.find(
          (order) => order.day === day
        );
        return existing
          ? {
              date: `${existing.year}-${String(existing.month).padStart(2, '0')}-${String(existing.day).padStart(2, '0')}`,
              confirmed: existing.total_orders_confirmed,
              cancelled:
                existing.total_orders_cancelled || 0,
            }
          : {
              day: day,
              value: 0,
              date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
              confirmed: 0,
              cancelled: 0,
            };
      });
    }

    return _orderData as ChartData[];
  }, [orders]);

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex min-h-24 flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0!">
          <CardTitle className="sm:text-sm">
            Trend Penjualan
          </CardTitle>
          <CardDescription className="text-xs">
            {/* Periode: {formatDate(start)} - {formatDate(end)} */}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-62.5 w-full"
        >
          <BarChart accessibilityLayer data={orderData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              // tickLine={false}
              // tickMargin={10}
              // axisLine={false}
              // tickFormatter={(value) => value.slice(0, 3)}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return formatDate(value);
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="confirmed"
              stackId="a"
              fill="var(--color-confirmed)"
              radius={[0, 0, 4, 4]}
              minPointSize={1}
            />
            <Bar
              dataKey="cancelled"
              stackId="a"
              fill="var(--color-cancelled)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
