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
import { ProfitOrder } from '../types';
import { getDatesBetween } from '@/lib/date';
import { formatDate } from '@/lib/formatter/date';

const chartConfig = {
  orders: {
    label: 'Orders',
  },
  createdAt: {
    label: 'Pesanan Dibuat',
    color: 'var(--chart-1)',
  },
  releasedAt: {
    label: 'Dana Dilepas',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

type ChartBarOrderTrendsProps = {
  start: Date | string;
  end: Date | string;
  orders: ProfitOrder[];
};

type ChartData = {
  date: Date | string;
  createdAt: number;
  releasedAt: number;
};

export const ChartBarOrderTrends = ({
  start,
  end,
  orders,
}: ChartBarOrderTrendsProps) => {
  const [activeChart, setActiveChart] =
    useState<keyof typeof chartConfig>('createdAt');

  const orderData = useMemo(() => {
    let grouped: any[] = [];

    if (start && end) {
      const _start = new Date(start);
      const _end = new Date(end);

      const getDateKey = (date: Date | string) => {
        // 1. Coerce to Date object safely
        const dateObj =
          typeof date === 'string' ? new Date(date) : date;

        // 2. Extract local date parts (Avoids UTC shifting bugs)
        const year = dateObj.getFullYear();
        const month = String(
          dateObj.getMonth() + 1
        ).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(
          2,
          '0'
        );

        // 3. Create the stable string key (YYYY-MM-DD)
        return `${year}-${month}-${day}`;
      };

      grouped = getDatesBetween(_start, _end).reduce(
        (acc, curr: Date) => {
          const item: ChartData = {
            date: getDateKey(curr),
            createdAt: 0,
            releasedAt: 0,
          };

          const _createdAt = orders.filter(
            (o) =>
              o.createdAt &&
              getDateKey(o.createdAt) === item.date
          );
          const _releasedAt = orders.filter(
            (o) =>
              o.releasedAt &&
              getDateKey(o.releasedAt) === item.date
          );

          item.createdAt = _createdAt.length ?? 0;
          item.releasedAt = _releasedAt.length ?? 0;

          acc.push(item);

          return acc;
        },
        [] as ChartData[]
      );

      return grouped;
    }

    return grouped;
  }, [orders]);

  const total = useMemo(
    () => ({
      createdAt: orderData.reduce(
        (acc, curr) => acc + curr.createdAt,
        0
      ),
      releasedAt: orderData.reduce(
        (acc, curr) => acc + curr.releasedAt,
        0
      ),
    }),
    []
  );

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0!">
          <CardTitle className="sm:text-sm">
            Trend Penjualan & Dana Dilepas
          </CardTitle>
          <CardDescription className="text-xs">
            Periode: {formatDate(start)} - {formatDate(end)}
          </CardDescription>
        </div>
        <div className="flex">
          {['createdAt', 'releasedAt'].map((key) => {
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
                <span className="text-lg leading-none font-bold sm:text-2xl">
                  {total[
                    key as keyof typeof total
                  ].toLocaleString()}
                </span>
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
