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

    const lifecycle = new FinanceLifecycleService(
      tenantContext
    );
    await lifecycle.start();
    const readiness = await lifecycle.getReadiness();

    return apiSuccess(readiness);
  } catch (error) {
    if (error instanceof FinanceDomainError) {
      const status =
        error.code === 'FINANCE_OWNER_REQUIRED' ||
        error.code === 'FINANCE_NOT_ACTIVE'
          ? 403
          : error.code ===
              'FINANCE_ONBOARDING_ALREADY_COMPLETED'
            ? 409
            : error.code ===
                'FINANCE_ORGANIZATION_NOT_FOUND'
              ? 404
              : error.code === 'FINANCE_LIFECYCLE_CONFLICT'
                ? 409
                : error.code ===
                      'FINANCE_ACCOUNT_TEMPLATE_INVALID' ||
                    error.code ===
                      'FINANCE_ACCOUNT_SEED_FAILED'
                  ? 500
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
