import { getTenantContext } from '@/lib/api/tenant-context';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import { AccountingDomainError } from '@/modules/accounting/accounting.error';
import { AccountingOnboardingService } from '@/modules/accounting/accounting-onboarding.service';

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
    const result = await new AccountingOnboardingService(
      tenantContext
    ).start();
    return apiSuccess(result, undefined, 201);
  } catch (error) {
    if (error instanceof AccountingDomainError) {
      const status =
        error.code === 'ONBOARDING_ALREADY_COMPLETED'
          ? 409
          : error.code === 'ACCOUNTING_OWNER_REQUIRED'
            ? 403
            : 422;
      return apiError(error.code, error.message, status);
    }
    console.error(
      '[POST /api/v1/dashboard/accounting/onboarding/start]',
      error
    );
    return apiError(
      ErrorCodes.INTERNAL_ERROR,
      'Gagal memulai accounting onboarding.',
      500
    );
  }
}
