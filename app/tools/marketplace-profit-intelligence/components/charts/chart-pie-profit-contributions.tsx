'use client';

import { useMemo } from 'react';
import { Label, Pie, PieChart } from 'recharts';

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
import { ProfitProduct } from '../types';
import { formatIDR } from '@/lib/formatter';
import { formatDate } from '@/lib/formatter/date';
import { PieChartIcon } from 'lucide-react';

type ChartPieProfitContributionProps = {
  start: Date | string;
  end: Date | string;
  totalProfit: number;
  products: ProfitProduct[];
};

export function ChartPieProfitContribution({
  start,
  end,
  totalProfit,
  products,
}: ChartPieProfitContributionProps) {
  const chartData = useMemo(() => {
    const sorted = products
      .filter((p) => p.totalProfit && p.totalProfit > 0)
      .sort(
        (a, b) =>
          (b.totalProfit ?? 0) - (a.totalProfit ?? 0)
      );

    const top = sorted.slice(0, 4).map((p, i) => ({
      name: p.name,
      profit: p.totalProfit,
      formattedProfit: formatIDR(p.totalProfit ?? 0, {
        showSymbol: false,
      }),
      fill: `var(--chart-${i + 1})`,
    }));

    const rest = sorted.slice(4);
    if (rest.length > 0) {
      const total = rest.reduce(
        (s, p) => s + (p.totalProfit ?? 0),
        0
      );
      top.push({
        name: 'Lainnya',
        profit: total,
        formattedProfit: formatIDR(total, {
          showSymbol: false,
        }),
        fill: `var(--chart-5)`,
      });
    }

    return top;
  }, [products]);

  const chartConfig = useMemo(() => {
    const config: Record<
      string,
      { label: string; color?: string }
    > = {
      profit: { label: 'Profit' },
    };
    chartData.forEach((d, i) => {
      config[d.name] = {
        label: d.name,
        color: `var(--chart-${i + 1})`,
      };
    });
    return config as ChartConfig;
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground p-8 text-center">
          <div className="flex h-75 flex-col items-center justify-center gap-2 text-center">
            <PieChartIcon className="text-muted-foreground/60 h-16 w-16" />
            <h3 className="text-muted-foreground font-semibold">
              Data belum tersedia
            </h3>
            <p className="text-muted-foreground/80 text-sm">
              Isi HPP produk terlebih dahulu untuk melihat
              kontribusi profit.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col overflow-visible">
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-4 sm:py-6">
          <CardTitle className="sm:text-sm">
            Kontribusi Profit per Produk
          </CardTitle>
          <CardDescription className="text-xs">
            Periode: {formatDate(start)} - {formatDate(end)}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="[&_.recharts-pie-label-text]:fill-foreground mx-auto min-h-75 w-full pb-0"
        >
          <PieChart
            margin={{
              top: 10,
              right: 40,
              bottom: 10,
              left: 40,
            }}
          >
            <ChartTooltip
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="profit"
              label={(props: any) =>
                `${props.formattedProfit}`
              }
              outerRadius="75%"
              innerRadius={60}
            >
              <Label
                content={({ viewBox }) => {
                  if (
                    viewBox &&
                    'cx' in viewBox &&
                    'cy' in viewBox
                  ) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 8}
                          className="fill-muted-foreground text-xs font-normal"
                        >
                          IDR
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 8}
                          className="fill-foreground text-sm font-bold"
                        >
                          {/* Visitors */}
                          {formatIDR(totalProfit ?? 0, {
                            showSymbol: false,
                          })}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
