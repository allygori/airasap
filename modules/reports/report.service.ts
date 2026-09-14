import { aggregateCustomerReport } from './customer/customer-report';
import { aggregateOperationReport } from './operation/operation-report';
import { aggregateProductSalesReport } from './product/product-report';
import {
  type CustomerReportResponseDTO,
  type CreateReportDTO,
  type OperationReportResponseDTO,
  type ProductAnalyticsResponseDTO,
  type OrderReportResponseDTO,
  type VoucherReportResponseDTO,
} from './report.dto';
import { ReportRepository } from './report.repository';
import { aggregateSalesReport } from './sales/sales-report';
import { aggregateOrderReport } from './orders/order-report';
import { aggregateVoucherReport } from './voucher/voucher-report';
import { StoreModel } from '@/modules/stores/store.model';
import {
  TIMEZONES,
  type TimeZone,
} from '@/constant/timezone';
import { TZDate } from '@date-fns/tz';
import {
  differenceInCalendarDays,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  parseISO,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  startOfDay,
  subDays,
  subMonths,
  subQuarters,
  subYears,
} from 'date-fns';

type ProductAnalyticsSummary =
  ProductAnalyticsResponseDTO['summary'];
type OrderReportSummary = OrderReportResponseDTO['summary'];
type OrderReportDailyReport =
  OrderReportResponseDTO['daily_reports'][number];
type CustomerReportSummary =
  CustomerReportResponseDTO['summary'];
type VoucherReportSummary =
  VoucherReportResponseDTO['summary'];
type OperationReportSummary =
  OperationReportResponseDTO['summary'];
type ReportPeriodMode = CreateReportDTO['mode'];

export class ReportService {
  private repository: ReportRepository;
  protected tenantContext: {
    organizationId: string;
    storeId: string;
  };
  private storeTimezone?: TimeZone;

  constructor(tenantContext: {
    organizationId: string;
    storeId: string;
  }) {
    this.repository = new ReportRepository(tenantContext);
    this.tenantContext = tenantContext;
  }

  private async getStoreTimezone(): Promise<TimeZone> {
    if (this.storeTimezone) return this.storeTimezone;

    const store = await StoreModel.findOne({
      _id: this.tenantContext.storeId,
      organization: this.tenantContext.organizationId,
      deleted_at: null,
    })
      .select({ timezone: 1 })
      .lean();

    this.storeTimezone =
      (store?.timezone as TimeZone | undefined) ||
      TIMEZONES.WIB.value;

    return this.storeTimezone;
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
    endDate: string,
    mode?: ReportPeriodMode
  ) {
    try {
      const timezone = await this.getStoreTimezone();
      const currentPipelines = aggregateProductSalesReport({
        startDate,
        endDate,
        tenantContext: this.tenantContext,
        filterBy: 'placed_at',
        tz: timezone,
      });
      const previousPeriod = getPreviousEquivalentPeriod(
        startDate,
        endDate,
        mode,
        timezone
      );
      const previousPipelines = aggregateProductSalesReport(
        {
          startDate: previousPeriod.startDate,
          endDate: previousPeriod.endDate,
          tenantContext: this.tenantContext,
          filterBy: 'placed_at',
          tz: timezone,
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

  async generateOrderReport(
    startDate: string,
    endDate: string,
    mode?: ReportPeriodMode
  ) {
    try {
      const timezone = await this.getStoreTimezone();
      const currentPipelines = aggregateOrderReport({
        startDate,
        endDate,
        tenantContext: this.tenantContext,
        filterBy: 'placed_at',
        tz: timezone,
      });
      const previousPeriod = getPreviousEquivalentPeriod(
        startDate,
        endDate,
        mode,
        timezone
      );
      const previousPipelines = aggregateOrderReport({
        startDate: previousPeriod.startDate,
        endDate: previousPeriod.endDate,
        tenantContext: this.tenantContext,
        filterBy: 'placed_at',
        tz: timezone,
      });

      const [currentReport, previousReport] =
        await Promise.all([
          this.repository.aggregate(currentPipelines),
          this.repository.aggregate(previousPipelines),
        ]);

      return withOrderReportComparison(
        currentReport[0] || null,
        previousReport[0] || null,
        previousPeriod,
        startDate,
        endDate
      );
    } catch (error: unknown) {
      throw new Error(
        `Gagal membuat laporan Order Report: ${getErrorMessage(error)}`
      );
    }
  }

  async generateCustomerReport(
    startDate: string,
    endDate: string
  ) {
    try {
      const timezone = await this.getStoreTimezone();
      const pipelines = aggregateCustomerReport({
        startDate,
        endDate,
        tenantContext: this.tenantContext,
        filterBy: 'placed_at',
        tz: timezone,
      });

      const report =
        await this.repository.aggregate(pipelines);

      return (
        report[0] ||
        createEmptyCustomerReport(startDate, endDate)
      );
    } catch (error: unknown) {
      throw new Error(
        `Gagal membuat customer report: ${getErrorMessage(error)}`
      );
    }
  }

  async generateVoucherReport(
    startDate: string,
    endDate: string
  ) {
    try {
      const timezone = await this.getStoreTimezone();
      const pipelines = aggregateVoucherReport({
        startDate,
        endDate,
        tenantContext: this.tenantContext,
        filterBy: 'placed_at',
        tz: timezone,
      });

      const report =
        await this.repository.aggregate(pipelines);

      return (
        report[0] ||
        createEmptyVoucherReport(startDate, endDate)
      );
    } catch (error: unknown) {
      throw new Error(
        `Gagal membuat voucher report: ${getErrorMessage(error)}`
      );
    }
  }

  async generateOperationReport(
    startDate: string,
    endDate: string
  ) {
    try {
      const timezone = await this.getStoreTimezone();
      const pipelines = aggregateOperationReport({
        startDate,
        endDate,
        tenantContext: this.tenantContext,
        filterBy: 'placed_at',
        tz: timezone,
      });

      const report =
        await this.repository.aggregate(pipelines);

      return (
        report[0] ||
        createEmptyOperationReport(startDate, endDate)
      );
    } catch (error: unknown) {
      throw new Error(
        `Gagal membuat operation report: ${getErrorMessage(error)}`
      );
    }
  }
}

const getPreviousEquivalentPeriod = (
  startDate: string,
  endDate: string,
  mode?: ReportPeriodMode,
  timezone: TimeZone = TIMEZONES.WIB.value
) => {
  const currentStart = startOfDay(
    new TZDate(startDate, timezone)
  );
  const currentEnd = startOfDay(
    new TZDate(endDate, timezone)
  );
  const previousRange = getPreviousRangeByMode(
    currentStart,
    currentEnd,
    mode
  );

  if (previousRange) {
    return {
      startDate: previousRange.startDate.toISOString(),
      endDate: previousRange.endDate.toISOString(),
    };
  }

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

const getPreviousRangeByMode = (
  currentStart: Date,
  currentEnd: Date,
  mode?: ReportPeriodMode
) => {
  switch (mode) {
    case 'today':
    case 'yesterday':
    case 'daily': {
      const previousDay = subDays(currentStart, 1);

      return {
        startDate: startOfDay(previousDay),
        endDate: startOfDay(previousDay),
      };
    }
    case '7-days': {
      const previousEnd = subDays(currentStart, 1);

      return {
        startDate: subDays(previousEnd, 6),
        endDate: previousEnd,
      };
    }
    case '30-days': {
      const previousEnd = subDays(currentStart, 1);

      return {
        startDate: subDays(previousEnd, 29),
        endDate: previousEnd,
      };
    }
    case 'weekly': {
      const previousEnd = subDays(currentStart, 1);

      return {
        startDate: subDays(previousEnd, 6),
        endDate: previousEnd,
      };
    }
    case 'monthly': {
      const previousMonth = subMonths(currentStart, 1);

      return {
        startDate: startOfMonth(previousMonth),
        endDate: endOfMonth(previousMonth),
      };
    }
    case 'quarterly': {
      const previousQuarter = subQuarters(currentStart, 1);

      return {
        startDate: startOfQuarter(previousQuarter),
        endDate: startOfDay(endOfQuarter(previousQuarter)),
      };
    }
    case 'semiannually': {
      const previousStart = subMonths(currentStart, 6);
      const previousEnd = subDays(currentStart, 1);

      return {
        startDate: startOfMonth(previousStart),
        endDate: startOfDay(previousEnd),
      };
    }
    case 'annually': {
      const previousYear = subYears(currentStart, 1);

      return {
        startDate: startOfYear(previousYear),
        endDate: startOfDay(endOfYear(previousYear)),
      };
    }
    case 'range':
    default:
      return null;
  }
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

const withOrderReportComparison = (
  currentReport: OrderReportResponseDTO | null,
  previousReport: OrderReportResponseDTO | null,
  previousPeriod: ReturnType<
    typeof getPreviousEquivalentPeriod
  >,
  startDate: string,
  endDate: string
) => {
  const current =
    currentReport ||
    createEmptyOrderReport(startDate, endDate);
  const previousSummary =
    previousReport?.summary ||
    createEmptyOrderReportSummary();
  const currentSummary =
    current.summary || createEmptyOrderReportSummary();

  return withOrderReportDecisionLayer({
    ...current,
    comparison: {
      previous_period: {
        start_date: previousPeriod.startDate,
        end_date: previousPeriod.endDate,
      },
      summary: {
        net_sales: previousSummary.net_sales || 0,
        net_profit: previousSummary.net_profit || 0,
        total_payment: previousSummary.total_payment || 0,
        orders: previousSummary.total_orders || 0,
        average_order_value:
          previousSummary.average_order_value || 0,
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
        total_payment: calculateGrowthRate(
          currentSummary.total_payment || 0,
          previousSummary.total_payment || 0
        ),
        orders: calculateGrowthRate(
          currentSummary.total_orders || 0,
          previousSummary.total_orders || 0
        ),
        average_order_value: calculateGrowthRate(
          currentSummary.average_order_value || 0,
          previousSummary.average_order_value || 0
        ),
        net_margin:
          (currentSummary.net_margin || 0) -
          (previousSummary.net_margin || 0),
      },
    },
  });
};

const withOrderReportDecisionLayer = (
  report: OrderReportResponseDTO
): OrderReportResponseDTO => {
  return {
    ...report,
    health_summary: buildOrderReportHealthSummary(report),
    profit_leakage: buildOrderReportProfitLeakage(report),
    best_days: buildOrderReportBestDays(
      report.daily_reports
    ),
    worst_days: buildOrderReportWorstDays(
      report.daily_reports
    ),
    order_metrics: buildOrderReportMetrics(report.summary),
    alerts: buildOrderReportAlerts(report),
    voucher_summary: buildOrderReportVoucherSummary(
      report.summary
    ),
    shopee_economics: buildOrderReportShopeeEconomics(
      report.summary,
      report.fee_breakdown
    ),
  };
};

const buildOrderReportHealthSummary = (
  report: OrderReportResponseDTO
): OrderReportResponseDTO['health_summary'] => {
  const { summary, comparison } = report;
  const notes: string[] = [];

  if (summary.total_orders === 0) {
    return {
      headline: 'Belum ada order selesai di periode ini.',
      tone: 'neutral',
      notes: [
        'Financial metrics hanya menghitung order Shopee berstatus selesai.',
      ],
    };
  }

  if (comparison) {
    notes.push(
      comparison.changes.net_sales >= 0
        ? 'Net sales naik dibanding periode sebelumnya.'
        : 'Net sales turun dibanding periode sebelumnya.'
    );
    notes.push(
      comparison.changes.net_profit >=
        comparison.changes.net_sales
        ? 'Profit bergerak lebih baik dari sales.'
        : 'Profit tertinggal dibanding pertumbuhan sales.'
    );
  }

  if (summary.net_margin < 0) {
    notes.push(
      'Net margin negatif, profit perlu ditinjau.'
    );
  } else if (summary.net_margin < 0.1) {
    notes.push(
      'Net margin masih tipis untuk menahan biaya.'
    );
  } else {
    notes.push('Net margin masih positif.');
  }

  if (summary.fee_ratio >= 0.12) {
    notes.push(
      'Fee Shopee cukup tinggi terhadap gross sales.'
    );
  }

  if (summary.seller_discount_ratio >= 0.1) {
    notes.push(
      'Diskon seller mengambil porsi besar dari gross sales.'
    );
  }

  const tone =
    summary.net_margin < 0
      ? 'bad'
      : summary.net_margin < 0.1 ||
          summary.fee_ratio >= 0.12 ||
          summary.seller_discount_ratio >= 0.1
        ? 'warning'
        : 'good';

  return {
    headline:
      tone === 'good'
        ? 'Sales sehat, profit masih positif.'
        : tone === 'warning'
          ? 'Sales berjalan, tapi ada tekanan margin.'
          : 'Sales menghasilkan rugi di periode ini.',
    tone,
    notes: notes.slice(0, 4),
  };
};

const buildOrderReportProfitLeakage = (
  report: OrderReportResponseDTO
): OrderReportResponseDTO['profit_leakage'] => {
  const grossSales = report.summary.gross_sales || 0;
  const items = [
    {
      key: 'cogs',
      label: 'COGS',
      value: report.summary.cogs || 0,
    },
    {
      key: 'shopee_fee',
      label: 'Shopee Fee',
      value: report.summary.shopee_fee || 0,
    },
    {
      key: 'seller_discount',
      label: 'Seller Discount',
      value: report.summary.seller_discount || 0,
    },
    {
      key: 'marketplace_deduction',
      label: 'Marketplace Deduction',
      value: report.summary.marketplace_deduction || 0,
    },
  ].map((item) => ({
    ...item,
    ratio: grossSales > 0 ? item.value / grossSales : 0,
  }));
  const totalLeakage = items.reduce(
    (total, item) => total + item.value,
    0
  );

  return {
    total_leakage: totalLeakage,
    leakage_ratio:
      grossSales > 0 ? totalLeakage / grossSales : 0,
    items,
  };
};

const buildOrderReportBestDays = (
  dailyReports: OrderReportDailyReport[]
): OrderReportResponseDTO['best_days'] => [
  getDayHighlight(
    dailyReports,
    'Highest Net Sales',
    'net_sales'
  ),
  getDayHighlight(
    dailyReports,
    'Highest Net Profit',
    'net_profit'
  ),
  getDayHighlight(dailyReports, 'Most Orders', 'orders'),
];

const buildOrderReportWorstDays = (
  dailyReports: OrderReportDailyReport[]
): OrderReportResponseDTO['worst_days'] => [
  getDayHighlight(
    dailyReports,
    'Lowest Net Margin',
    'net_margin',
    'asc'
  ),
  getDayHighlight(
    dailyReports,
    'Lowest Net Profit',
    'net_profit',
    'asc'
  ),
  getDayHighlight(
    dailyReports,
    'Highest Fee Day',
    'shopee_fee'
  ),
];

const getDayHighlight = (
  dailyReports: OrderReportDailyReport[],
  label: string,
  metric: keyof OrderReportDailyReport,
  direction: 'asc' | 'desc' = 'desc'
) => {
  const candidates = dailyReports.filter(
    (row) => typeof row[metric] === 'number'
  );
  const selected = candidates.sort((a, b) => {
    const current = Number(a[metric] || 0);
    const next = Number(b[metric] || 0);
    return direction === 'desc'
      ? next - current
      : current - next;
  })[0];

  return {
    label,
    date: selected?.date || null,
    value: Number(selected?.[metric] || 0),
    metric: String(metric),
  };
};

const buildOrderReportMetrics = (
  summary: OrderReportSummary
): OrderReportResponseDTO['order_metrics'] => ({
  average_profit_per_unit:
    summary.total_units > 0
      ? summary.net_profit / summary.total_units
      : 0,
  average_cogs_per_order:
    summary.total_orders > 0
      ? summary.cogs / summary.total_orders
      : 0,
  average_fee_per_order:
    summary.total_orders > 0
      ? summary.shopee_fee / summary.total_orders
      : 0,
  average_seller_discount_per_order:
    summary.total_orders > 0
      ? summary.seller_discount / summary.total_orders
      : 0,
  payment_to_net_sales_ratio:
    summary.net_sales > 0
      ? summary.total_payment / summary.net_sales
      : 0,
});

const buildOrderReportAlerts = (
  report: OrderReportResponseDTO
): OrderReportResponseDTO['alerts'] => {
  const alerts: OrderReportResponseDTO['alerts'] = [];
  const { summary, comparison, data_quality } = report;

  if (summary.net_margin < 0) {
    alerts.push({
      key: 'negative-net-margin',
      severity: 'danger',
      title: 'Net margin negatif',
      message:
        'Net profit periode ini negatif. Cek COGS, fee, dan diskon seller.',
    });
  } else if (summary.net_margin < 0.1) {
    alerts.push({
      key: 'thin-net-margin',
      severity: 'warning',
      title: 'Net margin tipis',
      message:
        'Margin di bawah 10%. Kenaikan fee atau diskon kecil bisa langsung menekan profit.',
    });
  }

  if (summary.fee_ratio >= 0.12) {
    alerts.push({
      key: 'high-fee-ratio',
      severity: 'warning',
      title: 'Fee Shopee tinggi',
      message:
        'Fee Shopee melewati 12% dari gross sales. Cek admin, processing, affiliate, dan campaign fee.',
    });
  }

  if (summary.seller_discount_ratio >= 0.1) {
    alerts.push({
      key: 'high-seller-discount',
      severity: 'warning',
      title: 'Diskon seller tinggi',
      message:
        'Diskon seller melewati 10% gross sales. Pastikan promo masih menghasilkan profit.',
    });
  }

  if (
    comparison &&
    comparison.changes.orders > 0 &&
    comparison.changes.net_profit < 0
  ) {
    alerts.push({
      key: 'orders-up-profit-down',
      severity: 'danger',
      title: 'Order naik, profit turun',
      message:
        'Volume order membaik, tetapi net profit turun. Ini biasanya tanda margin atau fee memburuk.',
    });
  }

  if (
    data_quality.net_sales_coverage < 0.9 ||
    data_quality.net_profit_coverage < 0.9
  ) {
    alerts.push({
      key: 'low-data-confidence',
      severity: 'info',
      title: 'Data confidence belum penuh',
      message:
        'Sebagian order belum memakai field financial kanonik. Re-enrich data jika angka terasa berbeda.',
    });
  }

  return alerts;
};

const buildOrderReportVoucherSummary = (
  summary: OrderReportSummary
): OrderReportResponseDTO['voucher_summary'] => {
  const totalDiscount =
    summary.seller_discount + summary.shopee_discount;

  return {
    voucher_codes_count: summary.voucher_codes.length,
    seller_discount: summary.seller_discount,
    shopee_discount: summary.shopee_discount,
    total_discount: totalDiscount,
    seller_share:
      totalDiscount > 0
        ? summary.seller_discount / totalDiscount
        : 0,
    discount_ratio:
      summary.gross_sales > 0
        ? totalDiscount / summary.gross_sales
        : 0,
    top_codes: summary.voucher_codes.slice(0, 5),
  };
};

const buildOrderReportShopeeEconomics = (
  summary: OrderReportSummary,
  feeBreakdown: OrderReportResponseDTO['fee_breakdown']
): OrderReportResponseDTO['shopee_economics'] => {
  const adminFee = feeBreakdown.admin_fee || 0;
  const processingFee = feeBreakdown.processing_fee || 0;
  const goxFee = feeBreakdown.gox_fee || 0;
  const totalShopeeFee = summary.shopee_fee || 0;
  const totalShopeeSubsidy =
    (summary.discount_from_shopee || 0) +
    (summary.voucher_borne_by_shopee || 0) +
    (summary.bundle_deal_discount_from_shopee || 0);
  const estimatedShopeeNetRevenue =
    totalShopeeFee - totalShopeeSubsidy;
  const otherFee = Math.max(
    0,
    totalShopeeFee - adminFee - processingFee - goxFee
  );

  return {
    shipping_forwarded_by_shopee:
      summary.shipping_forwarded_by_shopee || 0,
    discount_from_shopee: summary.discount_from_shopee || 0,
    voucher_borne_by_shopee:
      summary.voucher_borne_by_shopee || 0,
    bundle_deal_discount_from_shopee:
      summary.bundle_deal_discount_from_shopee || 0,
    admin_fee: adminFee,
    processing_fee: processingFee,
    gox_fee: goxFee,
    other_fee: otherFee,
    total_shopee_fee: totalShopeeFee,
    total_shopee_subsidy: totalShopeeSubsidy,
    estimated_shopee_net_revenue: estimatedShopeeNetRevenue,
    estimated_shopee_take_rate:
      summary.gross_sales > 0
        ? estimatedShopeeNetRevenue / summary.gross_sales
        : 0,
  };
};

const createEmptyOrderReportSummary =
  (): OrderReportSummary => ({
    total_orders: 0,
    total_buyers: 0,
    total_units: 0,
    total_items: 0,
    gross_sales: 0,
    net_sales: 0,
    total_payment: 0,
    released_funds: 0,
    cogs: 0,
    gross_profit: 0,
    net_profit: 0,
    seller_discount: 0,
    shopee_discount: 0,
    discount_from_shopee: 0,
    voucher_borne_by_shopee: 0,
    bundle_deal_discount_from_shopee: 0,
    shipping_forwarded_by_shopee: 0,
    shopee_fee: 0,
    marketplace_deduction: 0,
    average_order_value: 0,
    profit_per_order: 0,
    gross_margin: 0,
    net_margin: 0,
    fee_ratio: 0,
    seller_discount_ratio: 0,
    shopee_discount_ratio: 0,
    voucher_codes: [],
  });

const createEmptyOrderReport = (
  startDate: string,
  endDate: string
): OrderReportResponseDTO => ({
  summary: createEmptyOrderReportSummary(),
  daily_reports: [],
  fee_breakdown: {},
  status_breakdown: [],
  data_quality: {
    total_orders: 0,
    gross_sales_coverage: 0,
    net_sales_coverage: 0,
    net_profit_coverage: 0,
    released_funds_coverage: 0,
  },
  health_summary: {
    headline: 'Belum ada order selesai di periode ini.',
    tone: 'neutral',
    notes: [
      'Financial metrics hanya menghitung order Shopee berstatus selesai.',
    ],
  },
  profit_leakage: {
    total_leakage: 0,
    leakage_ratio: 0,
    items: [],
  },
  best_days: [],
  worst_days: [],
  order_metrics: {
    average_profit_per_unit: 0,
    average_cogs_per_order: 0,
    average_fee_per_order: 0,
    average_seller_discount_per_order: 0,
    payment_to_net_sales_ratio: 0,
  },
  alerts: [],
  voucher_summary: {
    voucher_codes_count: 0,
    seller_discount: 0,
    shopee_discount: 0,
    total_discount: 0,
    seller_share: 0,
    discount_ratio: 0,
    top_codes: [],
  },
  shopee_economics: {
    shipping_forwarded_by_shopee: 0,
    discount_from_shopee: 0,
    voucher_borne_by_shopee: 0,
    bundle_deal_discount_from_shopee: 0,
    admin_fee: 0,
    processing_fee: 0,
    gox_fee: 0,
    other_fee: 0,
    total_shopee_fee: 0,
    total_shopee_subsidy: 0,
    estimated_shopee_net_revenue: 0,
    estimated_shopee_take_rate: 0,
  },
  meta: {
    start_date: startDate,
    end_date: endDate,
    period_days: Math.max(
      1,
      differenceInCalendarDays(
        startOfDay(parseISO(endDate)),
        startOfDay(parseISO(startDate))
      ) + 1
    ),
  },
});

const createEmptyCustomerSummary =
  (): CustomerReportSummary => ({
    total_customers: 0,
    new_customers: 0,
    repeat_customers: 0,
    returning_customers: 0,
    total_orders: 0,
    total_net_sales: 0,
    total_net_profit: 0,
    total_payment: 0,
    total_units: 0,
    repeat_customer_rate: 0,
    returning_customer_rate: 0,
    average_orders_per_customer: 0,
    average_net_sales_per_customer: 0,
    average_net_profit_per_customer: 0,
    average_days_to_second_order: 0,
  });

const createEmptyCustomerReport = (
  startDate: string,
  endDate: string
): CustomerReportResponseDTO => ({
  summary: createEmptyCustomerSummary(),
  customers: [],
  repeat_interval_buckets: [],
  meta: {
    start_date: startDate,
    end_date: endDate,
    period_days: Math.max(
      1,
      differenceInCalendarDays(
        startOfDay(parseISO(endDate)),
        startOfDay(parseISO(startDate))
      ) + 1
    ),
  },
});

const createEmptyVoucherSummary =
  (): VoucherReportSummary => ({
    total_orders: 0,
    voucher_orders: 0,
    non_voucher_orders: 0,
    voucher_order_rate: 0,
    total_gross_sales: 0,
    total_net_sales: 0,
    total_net_profit: 0,
    total_payment: 0,
    seller_discount: 0,
    shopee_discount: 0,
    total_discount: 0,
    seller_discount_share: 0,
    discount_ratio: 0,
    net_margin: 0,
    campaign_fee: 0,
    affiliate_fee: 0,
    voucher_codes_count: 0,
  });

const createEmptyVoucherReport = (
  startDate: string,
  endDate: string
): VoucherReportResponseDTO => ({
  summary: createEmptyVoucherSummary(),
  vouchers: [],
  meta: {
    start_date: startDate,
    end_date: endDate,
    period_days: Math.max(
      1,
      differenceInCalendarDays(
        startOfDay(parseISO(endDate)),
        startOfDay(parseISO(startDate))
      ) + 1
    ),
  },
});

const createEmptyOperationSummary =
  (): OperationReportSummary => ({
    total_orders: 0,
    completed_orders: 0,
    cancelled_orders: 0,
    return_refund_orders: 0,
    in_progress_orders: 0,
    total_payment: 0,
    completed_payment: 0,
    cancelled_payment: 0,
    return_refund_payment: 0,
    completion_rate: 0,
    cancellation_rate: 0,
    return_refund_rate: 0,
    problem_order_rate: 0,
  });

const createEmptyOperationReport = (
  startDate: string,
  endDate: string
): OperationReportResponseDTO => ({
  summary: createEmptyOperationSummary(),
  status_breakdown: [],
  daily_reports: [],
  cancellation_reasons: [],
  meta: {
    start_date: startDate,
    end_date: endDate,
    period_days: Math.max(
      1,
      differenceInCalendarDays(
        startOfDay(parseISO(endDate)),
        startOfDay(parseISO(startDate))
      ) + 1
    ),
  },
});

const createEmptyProductSummary =
  (): ProductAnalyticsSummary => ({
    total_products: 0,
    total_orders: 0,
    product_order_count: 0,
    distinct_completed_orders: 0,
    total_units: 0,
    returned_units: 0,
    gross_sales: 0,
    total_gross_sales: 0,
    total_payment: 0,
    total_shopee_fee: 0,
    seller_discount: 0,
    shopee_discount: 0,
    voucher_codes: [],
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
