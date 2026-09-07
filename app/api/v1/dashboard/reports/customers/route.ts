/**
 * Customer Report API Routes
 * POST /api/v1/dashboard/reports/customers
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
  CustomerReportResponseDTO,
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
        await reportService.generateCustomerReport(
          body.startDate,
          body.endDate
        );

      return apiSuccess<CustomerReportResponseDTO>(
        report as CustomerReportResponseDTO,
        undefined,
        201
      );
    } catch (error) {
      console.error(
        '[POST /api/v1/dashboard/reports/customers]',
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : 'Gagal menghasilkan customer report';

      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        message,
        500
      );
    }
  }
);
