import { ReportRepository } from './report.repository';
import { aggregateSalesReport } from './@shared/aggregate/sales-report';

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

      console.log(
        'OrderService.generateSalesReport pipelines: ',
        JSON.stringify(pipelines, null, 2)
      );

      const report =
        await this.repository.aggregate(pipelines);

      console.log(
        'OrderService.generateSalesReport report: ',
        JSON.stringify(report, null, 2)
      );
      if (!report || report.length === 0) {
        throw new Error('Laporan tidak ditemukan');
      }

      return report[0] || null;

      // return report;
    } catch (error: any) {
      throw new Error(
        `Gagal membuat laporan: ${error.message}`
      );
    }
  }
}
