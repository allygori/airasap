import { aggregateProductSalesReport } from './product/product-report';
import { type ProductAnalyticsResponseDTO } from './report.dto';
import { ReportRepository } from './report.repository';
import { aggregateSalesReport } from './sales/sales-report';
import {
  differenceInCalendarDays,
  parseISO,
  startOfDay,
  subDays,
} from 'date-fns';

type ProductAnalyticsSummary =
  ProductAnalyticsResponseDTO['summary'];

export class ReportService {
  private repository: ReportRepository;
  protected tenantContext: {
    organizationId: string;
    storeId: string;
  };

  constructor(tenantContext: {
    organizationId: string;
    storeId: string;
  }) {
    this.repository = new ReportRepository(tenantContext);
    this.tenantContext = tenantContext;
  }

  // async generateReport(
  //   startDate: string | Date,
  //   endDate: string | Date
  // ) {
  //   try {
  //     const pipelines = aggregateSalesReport({
  //       startDate,
  //       endDate,
  //       tenantContext: this.tenantContext,
  //       filterBy: 'placed_at',
  //     });
  //     const report =
  //       await this.repository.aggregate(pipelines);

  //     if (!report) {
  //       throw new Error('Laporan tidak ditemukan');
  //     }

  //     return report;
  //   } catch (error: any) {
  //     throw new Error(
  //       `Gagal membuat laporan: ${error.message}`
  //     );
  //   }
  // }

  async generateSalesReport(
    startDate: string,
    endDate: string
  ) {
    try {
      const pipelines = aggregateSalesReport({
        startDate,
        endDate,
        tenantContext: this.tenantContext,
        filterBy: 'placed_at',
        tz: 'Asia/Jakarta',
      });

      // console.log(
      //   'OrderService.generateSalesReport pipelines: ',
      //   JSON.stringify(pipelines, null, 2)
      // );

      const report =
        await this.repository.aggregate(pipelines);

      // console.log(
      //   'OrderService.generateSalesReport report: ',
      //   JSON.stringify(report, null, 2)
      // );

      // if (!report || report.length === 0) {
      //   throw new Error('Laporan tidak ditemukan');
      // }

      return report[0] || null;

      // return report;
    } catch (error: unknown) {
      throw new Error(
        `Gagal membuat laporan: ${getErrorMessage(error)}`
      );
    }
  }

  async generateProductSalesReport(
    startDate: string,
    endDate: string
  ) {
    try {
      const currentPipelines = aggregateProductSalesReport({
        startDate,
        endDate,
        tenantContext: this.tenantContext,
        filterBy: 'placed_at',
        tz: 'Asia/Jakarta',
      });
      const previousPeriod = getPreviousEquivalentPeriod(
        startDate,
        endDate
      );
      const previousPipelines = aggregateProductSalesReport(
        {
          startDate: previousPeriod.startDate,
          endDate: previousPeriod.endDate,
          tenantContext: this.tenantContext,
          filterBy: 'placed_at',
          tz: 'Asia/Jakarta',
        }
      );

      // console.log(
      //   'OrderService.generateSalesReport pipelines: ',
      //   JSON.stringify(pipelines, null, 2)
      // );

      const [currentReport, previousReport] =
        await Promise.all([
          this.repository.aggregate(currentPipelines),
          this.repository.aggregate(previousPipelines),
        ]);

      // console.log(
      //   'OrderService.generateSalesReport report: ',
      //   JSON.stringify(report, null, 2)
      // );

      // if (!report || report.length === 0) {
      //   throw new Error('Laporan tidak ditemukan');
      // }

      return withProductComparison(
        currentReport[0] || null,
        previousReport[0] || null,
        previousPeriod
      );

      // return report;
    } catch (error: unknown) {
      throw new Error(
        `Gagal membuat laporan: ${getErrorMessage(error)}`
      );
    }
  }
}

const getPreviousEquivalentPeriod = (
  startDate: string,
  endDate: string
) => {
  const currentStart = startOfDay(parseISO(startDate));
  const currentEnd = startOfDay(parseISO(endDate));
  const periodDays = Math.max(
    1,
    differenceInCalendarDays(currentEnd, currentStart) + 1
  );
  const previousEnd = subDays(currentStart, 1);
  const previousStart = subDays(
    previousEnd,
    periodDays - 1
  );

  return {
    startDate: previousStart.toISOString(),
    endDate: previousEnd.toISOString(),
  };
};

const withProductComparison = (
  currentReport: ProductAnalyticsResponseDTO | null,
  previousReport: ProductAnalyticsResponseDTO | null,
  previousPeriod: ReturnType<
    typeof getPreviousEquivalentPeriod
  >
) => {
  if (!currentReport) return currentReport;

  const previousSummary =
    previousReport?.summary || createEmptyProductSummary();
  const currentSummary =
    currentReport.summary || createEmptyProductSummary();

  return {
    ...currentReport,
    comparison: {
      previous_period: {
        start_date: previousPeriod.startDate,
        end_date: previousPeriod.endDate,
      },
      summary: {
        net_sales: previousSummary.net_sales || 0,
        net_profit: previousSummary.net_profit || 0,
        units: previousSummary.total_units || 0,
        orders: previousSummary.total_orders || 0,
        net_margin: previousSummary.net_margin || 0,
      },
      changes: {
        net_sales: calculateGrowthRate(
          currentSummary.net_sales || 0,
          previousSummary.net_sales || 0
        ),
        net_profit: calculateGrowthRate(
          currentSummary.net_profit || 0,
          previousSummary.net_profit || 0
        ),
        units: calculateGrowthRate(
          currentSummary.total_units || 0,
          previousSummary.total_units || 0
        ),
        orders: calculateGrowthRate(
          currentSummary.total_orders || 0,
          previousSummary.total_orders || 0
        ),
        net_margin:
          (currentSummary.net_margin || 0) -
          (previousSummary.net_margin || 0),
      },
    },
  };
};

const calculateGrowthRate = (
  currentValue: number,
  previousValue: number
) => {
  if (previousValue === 0) {
    return currentValue === 0 ? 0 : 1;
  }

  return (
    (currentValue - previousValue) / Math.abs(previousValue)
  );
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const createEmptyProductSummary =
  (): ProductAnalyticsSummary => ({
    total_products: 0,
    total_orders: 0,
    total_units: 0,
    returned_units: 0,
    gross_sales: 0,
    discount: 0,
    net_sales: 0,
    cogs: 0,
    gross_profit: 0,
    platform_fee: 0,
    shipping_cost: 0,
    other_variable_cost: 0,
    marketplace_deduction: 0,
    net_profit: 0,
    gross_margin: 0,
    net_margin: 0,
    total_items: 0,
    items_with_stored_net_sales: 0,
    items_with_stored_net_profit: 0,
    canonical_net_sales_rate: 0,
    canonical_net_profit_rate: 0,
    data_quality_score: 0,
  });
