import { getTenantContext } from '@/lib/api/tenant-context';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { withValidation } from '@/lib/api/validate';
import { db } from '@/lib/db/connection';
import {
  CancellationReportResponseDTO,
  CreateReportDTO,
  CreateReportSchema,
} from '@/modules/reports/report.dto';
import { ReportService } from '@/modules/reports/report.service';

export const POST = withValidation(
  CreateReportSchema,
  async (_request, { validatedBody }) => {
    try {
      const tenantContext = await getTenantContext();
      if (
        !tenantContext.organizationId ||
        !tenantContext.storeId
      ) {
        return apiError(
          ErrorCodes.BAD_REQUEST,
          'Organization atau Store ID tidak ditemukan',
          403
        );
      }

      await db.connect();
      const body = validatedBody as CreateReportDTO;
      const report = await new ReportService(
        tenantContext
      ).generateCancellationReport(
        body.startDate,
        body.endDate
      );

      return apiSuccess<CancellationReportResponseDTO>(
        report,
        undefined,
        201
      );
    } catch (error) {
      console.error(
        '[POST /api/v1/dashboard/reports/cancellations]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error
          ? error.message
          : 'Gagal menghasilkan cancellation report',
        500
      );
    }
  }
);
