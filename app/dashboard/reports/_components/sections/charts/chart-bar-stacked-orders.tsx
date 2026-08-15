'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
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

const chartConfigs = [
  {
    key: 'order',
    label: 'Orders',
    config: {
      orders: {
        label: 'Orders',
      },
      confirmed: {
        label: 'Pesanan Dikonfirmasi',
        color: 'var(--chart-1)',
      },
      cancelled: {
        label: 'Pesanan Dibatalkan',
        color: 'var(--destructive)',
      },
    } satisfies ChartConfig,
  },
  {
    key: 'profit',
    label: 'Profit',
    config: {
      orders: {
        label: 'Orders',
      },
      payment: {
        label: 'Pembayaran Pembeli',
        color: 'var(--chart-1)',
      },
      cost: {
        label: 'HPP',
        color: 'var(--destructive)',
      },
      profit: {
        label: 'Profit',
        color: 'var(--color-emerald-400)',
      },
    } satisfies ChartConfig,
  },
];

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
    color: 'var(--destructive)',
  },
} satisfies ChartConfig;

type Order = SalesReportResponseDTO['daily_reports'][0];

type ChartBarStackedOrdersProps = {
  // start: Date | string;
  // end: Date | string;
  orders: Order[];
};

type ChartData = {
  date: Date | string;
  confirmed: number;
  cancelled: number;
};

type ChartData2 = {
  date: Date | string;
  data1: number;
  data2: number;
  data3?: number;
};

export const ChartBarStackedOrders = ({
  // start,
  // end,
  orders,
}: ChartBarStackedOrdersProps) => {
  // const [activeChart, setActiveChart] =
  //   useState<keyof typeof chartConfig>('confirmed');
  const [activeChart, setActiveChart] = useState<
    (typeof chartConfigs)[0]
  >(chartConfigs[0]);

  // const orderData = useMemo(() => {
  //   let _orderData: ChartData[] = [];
  //   const year = orders[0]?.year;
  //   const month = orders[0]?.month;

  //   if (year && month) {
  //     const daysInMonth = new Date(
  //       year,
  //       month,
  //       0
  //     ).getDate();

  //     const fullMonth = Array.from(
  //       { length: daysInMonth },
  //       (_, i) => i + 1
  //     );

  //     _orderData = fullMonth.map((day) => {
  //       const existing = orders.find(
  //         (order) => order.day === day
  //       );
  //       return existing
  //         ? {
  //             date: `${existing.year}-${String(existing.month).padStart(2, '0')}-${String(existing.day).padStart(2, '0')}`,
  //             confirmed: existing.total_orders_confirmed,
  //             cancelled:
  //               existing.total_orders_cancelled || 0,
  //           }
  //         : {
  //             day: day,
  //             value: 0,
  //             date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  //             confirmed: 0,
  //             cancelled: 0,
  //           };
  //     });
  //   }

  //   return _orderData as ChartData[];
  // }, [orders]);

  const orderData = useMemo(() => {
    let _orderData: ChartData2[] = [];
    const year = orders[0]?.year;
    const month = orders[0]?.month;
    let fullMonth: number[] = [];

    if (year && month) {
      const daysInMonth = new Date(
        year,
        month,
        0
      ).getDate();

      fullMonth = Array.from(
        { length: daysInMonth },
        (_, i) => i + 1
      );
    }

    if (activeChart.key === 'order') {
      _orderData = fullMonth.map((day) => {
        const existing = orders.find(
          (order) => order.day === day
        );
        return existing
          ? {
              date: `${existing.year}-${String(existing.month).padStart(2, '0')}-${String(existing.day).padStart(2, '0')}`,
              data1: existing.total_orders_confirmed,
              data2: existing.total_orders_cancelled || 0,
            }
          : {
              day: day,
              value: 0,
              date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
              data1: 0,
              data2: 0,
            };
      });
    } else if (activeChart.key === 'profit') {
      _orderData = fullMonth.map((day) => {
        const existing = orders.find(
          (order) => order.day === day
        );
        return existing
          ? {
              date: `${existing.year}-${String(existing.month).padStart(2, '0')}-${String(existing.day).padStart(2, '0')}`,
              data1: existing.daily_payment || 0,
              data2: existing.daily_cost || 0,
              data3: existing.daily_profit || 0,
            }
          : {
              day: day,
              value: 0,
              date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
              data1: 0,
              data2: 0,
            };
      });
    }

    return _orderData as ChartData2[];
  }, [orders, activeChart]);

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0!">
          <CardTitle className="sm:text-sm">
            Trend Order & Profit
          </CardTitle>
          <CardDescription className="text-xs">
            {/* Periode: {formatDate(start)} - {formatDate(end)} */}
          </CardDescription>
        </div>
        <div className="flex">
          {chartConfigs.map((sc) => {
            // const chart = key as keyof typeof chartConfigs;
            return (
              <button
                key={sc.key}
                data-active={activeChart.key === sc.key}
                className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 cursor-pointer flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveChart(sc)}
              >
                <span className="text-muted-foreground text-xs">
                  {sc.label}
                </span>
              </button>
            );
          })}
          {/* {['confirmed', 'cancelled'].map((key) => {
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
              </button>
            );
          })} */}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={
            activeChart.config as unknown as ChartConfig
          }
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
              tickMargin={10}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('id-ID', {
                  month: 'short',
                  day: 'numeric',
                });
              }}
            />
            {/* <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-37.5"
                  nameKey="orders"
                  labelFormatter={(value) => {
                    return new Date(
                      value
                    ).toLocaleDateString('id-ID', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                  }}
                />
              }
            /> */}
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return formatDate(value);
                  }}
                />
              }
            />
            {/* <Bar
              dataKey={activeChart}
              fill={`var(--color-${activeChart})`}
              minPointSize={1}
            /> */}

            {activeChart.key === 'profit' ? (
              <>
                {/* <Bar
                  dataKey="data1"
                  stackId="a"
                  fill="var(--color-payment)"
                  radius={[2, 2, 2, 2]}
                  minPointSize={1}
                />
                <Bar
                  dataKey="data2"
                  stackId="b"
                  fill="var(--color-cost)"
                  radius={[0, 0, 2, 2]}
                /> */}
                <Bar
                  dataKey="data3"
                  stackId="b"
                  fill="var(--color-emerald-400)"
                  // radius={[2, 2, 0, 0]}
                  radius={4}
                >
                  {/* <LabelList
                    position="top"
                    offset={12}
                    className="fill-foreground"
                    fontSize={12}
                  /> */}
                </Bar>
              </>
            ) : (
              <>
                <Bar
                  dataKey="data1"
                  stackId="a"
                  fill="var(--color-confirmed)"
                  radius={[0, 0, 4, 4]}
                  minPointSize={1}
                />
                <Bar
                  dataKey="data2"
                  stackId="a"
                  fill="var(--color-cancelled)"
                  radius={[4, 4, 0, 0]}
                />
              </>
            )}

            {/* {activeChart.key === 'profit' && (
              
              <Bar
                dataKey="data3"
                stackId="a"
                fill="var(--chart-3)"
                radius={[4, 4, 0, 0]}
              />
            )} */}
          </BarChart>
        </ChartContainer>

        {/* <ChartContainer
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
        </ChartContainer> */}
      </CardContent>
    </Card>
  );
};
