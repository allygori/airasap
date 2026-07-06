'use client';

import { useMemo, useState } from 'react';
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
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
// import { ProfitOrder } from '@/modules/reports/report.dto';
import { SalesReportResponseDTO } from '@/modules/reports/report.dto';
import { getDatesBetween } from '@/lib/date';
import { formatDate } from '@/lib/formatter/date';

const chartConfig = {
  orders: {
    label: 'Orders',
  },
  confirmed: {
    label: 'Pesanan Dikonfirmasi',
    color: 'var(--chart-1)',
  },
  cancelled: {
    label: 'Pesanan Dibatalkan',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

type Order = SalesReportResponseDTO['daily_reports'][0];

type BarChartOrderTrendsProps = {
  // start: Date | string;
  // end: Date | string;
  orders: Order[];
};

type ChartData = {
  date: Date | string;
  confirmed: number;
  cancelled: number;
};

export const BarChartOrderTrends = ({
  // start,
  // end,
  orders,
}: BarChartOrderTrendsProps) => {
  const [activeChart, setActiveChart] =
    useState<keyof typeof chartConfig>('confirmed');

  // const orderData = useMemo(() => {
  //   let grouped: any[] = [];

  //   if (start && end) {
  //     const _start = new Date(start);
  //     const _end = new Date(end);

  //     const getDateKey = (date: Date | string) => {
  //       // 1. Coerce to Date object safely
  //       const dateObj =
  //         typeof date === 'string' ? new Date(date) : date;

  //       // 2. Extract local date parts (Avoids UTC shifting bugs)
  //       const year = dateObj.getFullYear();
  //       const month = String(
  //         dateObj.getMonth() + 1
  //       ).padStart(2, '0');
  //       const day = String(dateObj.getDate()).padStart(
  //         2,
  //         '0'
  //       );

  //       // 3. Create the stable string key (YYYY-MM-DD)
  //       return `${year}-${month}-${day}`;
  //     };

  //     grouped = getDatesBetween(_start, _end).reduce(
  //       (acc, curr: Date) => {
  //         const item: ChartData = {
  //           date: getDateKey(curr),
  //           createdAt: 0,
  //           releasedAt: 0,
  //         };

  //         const _createdAt = orders.filter(
  //           (o) =>
  //             o.createdAt &&
  //             getDateKey(o.createdAt) === item.date
  //         );
  //         const _releasedAt = orders.filter(
  //           (o) =>
  //             o.releasedAt &&
  //             getDateKey(o.releasedAt) === item.date
  //         );

  //         item.createdAt = _createdAt.length ?? 0;
  //         item.releasedAt = _releasedAt.length ?? 0;

  //         acc.push(item);

  //         return acc;
  //       },
  //       [] as ChartData[]
  //     );

  //     return grouped;
  //   }

  //   return grouped;
  // }, [orders]);

  const orderData = useMemo(() => {
    // const _orderData = (orders || [])
    //   .sort((a, b) => a.day - b.day)
    //   .map((order, idx: number) => {
    //     return {
    //       date: `${order.year}-${String(order.month).padStart(2, '0')}-${String(order.day).padStart(2, '0')}`,
    //       confirmed: order.total_orders_confirmed,
    //       cancelled: order.total_orders_cancelled || 0,
    //     };
    //   });

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

    // const sortedData = (orders || [])
    //   .sort((a, b) => a.day - b.day);

    // for(let i = 1; i < 31; i++) {
    //   if (sortedData[i])
    // }
    //   .map((order, idx: number) => {
    //     return {
    //       date: `${order.year}-${String(order.month).padStart(2, '0')}-${String(order.day).padStart(2, '0')}`,
    //       confirmed: order.total_orders_confirmed,
    //       cancelled: order.total_orders_cancelled || 0,
    //     };
    //   });

    return _orderData as ChartData[];
  }, [orders]);

  // const total = useMemo(
  //   () => ({
  //     createdAt: orderData.reduce(
  //       (acc, curr) => acc + curr.createdAt,
  //       0
  //     ),
  //     releasedAt: orderData.reduce(
  //       (acc, curr) => acc + curr.releasedAt,
  //       0
  //     ),
  //   }),
  //   []
  // );

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0!">
          <CardTitle className="sm:text-sm">
            Trend Penjualan & Dana Dilepas
          </CardTitle>
          <CardDescription className="text-xs">
            {/* Periode: {formatDate(start)} - {formatDate(end)} */}
          </CardDescription>
        </div>
        <div className="flex">
          {['confirmed', 'cancelled'].map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 cursor-pointer flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-muted-foreground text-xs">
                  {chartConfig[chart].label}
                </span>
                {/* <span className="text-lg leading-none font-bold sm:text-2xl">
                  {total[
                    key as keyof typeof total
                  ].toLocaleString()}
                </span> */}
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-62.5 w-full"
        >
          <BarChart
            accessibilityLayer
            data={orderData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
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
                  className="w-37.5"
                  nameKey="orders"
                  labelFormatter={(value) => {
                    return new Date(
                      value
                    ).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                  }}
                />
              }
            />
            <Bar
              dataKey={activeChart}
              fill={`var(--color-${activeChart})`}
              minPointSize={1}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
