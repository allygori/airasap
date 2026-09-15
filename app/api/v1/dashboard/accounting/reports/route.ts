import { getTenantContext } from '@/lib/api/tenant-context';
import { withValidation } from '@/lib/api/validate';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import { AccountingReportService } from '@/modules/accounting/reports/accounting-report.service';
import { AccountingReportQuerySchema } from '@/modules/accounting/reports/accounting-report.schema';

export const GET = withValidation(
  { query: AccountingReportQuerySchema },
  async (_request, { validatedQuery }) => {
    try {
      const tenantContext = await getTenantContext();
      if (!tenantContext.organizationId) {
        return apiError(
          ErrorCodes.FORBIDDEN,
          'Organization ID tidak ditemukan.',
          403
        );
      }

      await db.connect();
      const report = await new AccountingReportService(
        tenantContext
      ).getReport(validatedQuery!);

      return apiSuccess(report);
    } catch (error) {
      console.error(
        '[GET /api/v1/dashboard/accounting/reports]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error
          ? error.message
          : 'Gagal memuat laporan accounting.',
        500
      );
    }
  }
);
