/**
 * Sales Report V2 API Routes
 * POST /api/v1/dashboard/reports/sales-2
 */

import { getTenantContext } from '@/lib/api/tenant-context';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { withValidation } from '@/lib/api/validate';
import { db } from '@/lib/db/connection';
import {
  CreateReportDTO,
  CreateReportSchema,
  SalesV2ResponseDTO,
} from '@/modules/reports/report.dto';
import { ReportService } from '@/modules/reports/report.service';

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
      const report =
        await reportService.generateSalesV2Report(
          body.startDate,
          body.endDate,
          body.mode
        );

      return apiSuccess<SalesV2ResponseDTO>(
        report as SalesV2ResponseDTO,
        undefined,
        201
      );
    } catch (error) {
      console.error(
        '[POST /api/v1/dashboard/reports/sales-2]',
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : 'Gagal menghasilkan laporan sales v2';

      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        message,
        500
      );
    }
  }
);
