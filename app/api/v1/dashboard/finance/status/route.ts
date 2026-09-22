import { getTenantContext } from '@/lib/api/tenant-context';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import {
  FinanceDomainError,
  FinanceLifecycleService,
} from '@/modules/finance';

export async function GET() {
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

    const readiness = await new FinanceLifecycleService(
      tenantContext
    ).getReadiness();

    return apiSuccess(readiness);
  } catch (error) {
    if (error instanceof FinanceDomainError) {
      const status =
        error.code === 'FINANCE_ORGANIZATION_NOT_FOUND'
          ? 404
          : 400;

      return apiError(error.code, error.message, status);
    }

    console.error(
      '[GET /api/v1/dashboard/finance/status]',
      error
    );

    return apiError(
      ErrorCodes.INTERNAL_ERROR,
      'Gagal memuat status Finance.',
      500
    );
  }
}
