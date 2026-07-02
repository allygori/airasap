/**
 * Report API Routes
 * POST /api/v1/dashboard/reports - Reports by start date and end date
 */

import { ReportService } from '@/modules/reports/report.service';
import {
  CreateReportSchema,
  CreateReportDTO,
} from '@/modules/reports/report.dto';
import { withValidation } from '@/lib/api/validate';
import {
  apiSuccess,
  apiError,
  ErrorCodes,
} from '@/lib/api/response';
import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';

export const POST = withValidation(
  CreateReportSchema,
  async (request, { validatedBody }) => {
    try {
      const tenantContext = await getTenantContext();

      if (!tenantContext.organizationId) {
        return apiError(
          ErrorCodes.BAD_REQUEST,
          'Organization ID tidak ditemukan',
          403
        );
      }

      if (!tenantContext.storeId) {
        return apiError(
          ErrorCodes.BAD_REQUEST,
          'Store ID tidak ditemukan',
          403
        );
      }

      await db.connect();

      const reportService = new ReportService(
        tenantContext
      );
      const body = validatedBody as CreateReportDTO;
      const report = await reportService.generateReport(
        body.startDate,
        body.endDate
      );

      return apiSuccess(report, undefined, 201);
    } catch (error: any) {
      console.error(
        '[POST /api/v1/dashboard/reports]',
        error
      );

      if (error.message?.includes('sudah ada')) {
        return apiError(
          ErrorCodes.CONFLICT,
          error.message,
          409
        );
      }

      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error.message || 'Gagal menghasilkan laporan',
        500
      );
    }
  }
);
