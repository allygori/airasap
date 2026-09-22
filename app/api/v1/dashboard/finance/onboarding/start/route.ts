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

export async function POST() {
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

    const finance = await new FinanceLifecycleService(
      tenantContext
    ).start();

    return apiSuccess({ finance });
  } catch (error) {
    if (error instanceof FinanceDomainError) {
      const status =
        error.code === 'FINANCE_OWNER_REQUIRED'
          ? 403
          : error.code ===
              'FINANCE_ONBOARDING_ALREADY_COMPLETED'
            ? 409
            : error.code ===
                'FINANCE_ORGANIZATION_NOT_FOUND'
              ? 404
              : 400;

      return apiError(error.code, error.message, status);
    }

    console.error(
      '[POST /api/v1/dashboard/finance/onboarding/start]',
      error
    );

    return apiError(
      ErrorCodes.INTERNAL_ERROR,
      'Gagal memulai Finance onboarding.',
      500
    );
  }
}
