import { getTenantContext } from '@/lib/api/tenant-context';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import {
  FinanceDomainError,
  FinanceEntitlementService,
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
    const result = await new FinanceEntitlementService(
      tenantContext
    ).getAvailability();

    return apiSuccess(result);
  } catch (error: unknown) {
    if (error instanceof FinanceDomainError) {
      return apiError(
        error.code,
        error.message,
        error.code === 'FINANCE_ORGANIZATION_NOT_FOUND'
          ? 404
          : 403
      );
    }

    console.error(
      '[GET /api/v1/dashboard/finance/access]',
      error
    );
    return apiError(
      ErrorCodes.INTERNAL_ERROR,
      'Gagal memeriksa akses Finance.',
      500
    );
  }
}
