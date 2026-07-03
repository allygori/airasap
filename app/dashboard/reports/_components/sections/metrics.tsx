'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatIDR } from '@/lib/formatter';
// import type { ProfitReportData } from './types';

type MetricsProps = {
  revenue?: number;
  payout?: number;
  estimateCOGS?: number;
  estimateProfit?: number;
  // reportData: ProfitReportData;/
  // totalCOGS: number;
};

export function Metrics({
  // reportData,
  // totalCOGS,
  revenue,
  payout,
  estimateCOGS,
  estimateProfit,
}: MetricsProps) {
  // const netSales =
  //   (reportData.extra?.summary_data?.[1]?.subItems?.[0]
  //     ?.value || 0) +
  //   (reportData.extra?.summary_data?.[1]?.subItems?.[1]
  //     ?.value || 0);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm">
            Total Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatIDR(revenue || 0)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm">
            Net Payout (Dari Shopee)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatIDR(payout || 0)}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-amber-50 dark:bg-amber-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-amber-700 dark:text-amber-400">
            Estimasi HPP (Modal)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
            {formatIDR(estimateCOGS || 0)}
          </div>
        </CardContent>
      </Card>
      <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-green-700 dark:text-green-400">
            Real Profit (Cuan Bersih)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">
            {formatIDR(estimateProfit || 0)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
