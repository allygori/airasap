import { AggregateBuilder } from './@shared/aggregate/builder';
import salesReport from './@shared/aggregate/sales-report';
import { ReportRepository } from './report.repository';

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

  async generateReport(
    startDate: string | Date,
    endDate: string | Date
  ) {
    try {
      const pipelines = salesReport({
        startDate,
        endDate,
        tenantContext: this.tenantContext,
        filterBy: 'order_created_at',
      });
      const report =
        await this.repository.aggregate(pipelines);

      if (!report) {
        throw new Error('Laporan tidak ditemukan');
      }

      return report;
    } catch (error: any) {
      throw new Error(
        `Gagal membuat laporan: ${error.message}`
      );
    }
  }

  async generateSalesReport(
    startDate: string | Date,
    endDate: string | Date
  ) {
    try {
      const pipelines = salesReport({
        startDate,
        endDate,
        tenantContext: this.tenantContext,
        filterBy: 'order_created_at',
      });
      const report =
        await this.repository.aggregate(pipelines);

      if (!report) {
        throw new Error('Laporan tidak ditemukan');
      }

      return report;
    } catch (error: any) {
      throw new Error(
        `Gagal membuat laporan: ${error.message}`
      );
    }
  }
}
