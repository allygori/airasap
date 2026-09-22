import { getTenantContext } from '@/lib/api/tenant-context';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import {
  FinanceDomainError,
  FinanceOpeningBalanceService,
  type FinanceOpeningBalancePreviewDTO,
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
    const preview: FinanceOpeningBalancePreviewDTO =
      await new FinanceOpeningBalanceService(
        tenantContext
      ).preview();
    return apiSuccess(preview);
  } catch (error: unknown) {
    if (error instanceof FinanceDomainError) {
      const status =
        error.code === 'FINANCE_OWNER_REQUIRED'
          ? 403
          : error.code === 'FINANCE_ORGANIZATION_NOT_FOUND'
            ? 404
            : error.code ===
                  'FINANCE_OPENING_BALANCE_DRAFT_REQUIRED' ||
                error.code ===
                  'FINANCE_ONBOARDING_NOT_IN_PROGRESS'
              ? 409
              : 422;
      return apiError(error.code, error.message, status);
    }

    console.error(
      '[GET /api/v1/dashboard/finance/onboarding/opening-balance/preview]',
      error
    );
    return apiError(
      ErrorCodes.INTERNAL_ERROR,
      'Gagal membuat preview opening balance Finance.',
      500
    );
  }
}
