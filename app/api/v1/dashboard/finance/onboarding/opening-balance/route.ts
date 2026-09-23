import { getTenantContext } from '@/lib/api/tenant-context';
import { withValidation } from '@/lib/api/validate';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import {
  FinanceDomainError,
  assertFinancePremium,
  FinanceOpeningBalanceDraftInputSchema,
  FinanceOpeningBalanceService,
} from '@/modules/finance';

const getErrorStatus = (code: string) => {
  if (code === 'FINANCE_OWNER_REQUIRED') return 403;
  if (code === 'FINANCE_NOT_ACTIVE') return 403;
  if (code === 'FINANCE_ORGANIZATION_NOT_FOUND') return 404;
  if (
    code === 'FINANCE_ONBOARDING_NOT_IN_PROGRESS' ||
    code === 'FINANCE_ONBOARDING_ALREADY_COMPLETED' ||
    code === 'FINANCE_OPENING_BALANCE_SAVE_CONFLICT'
  ) {
    return 409;
  }
  return 422;
};

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
    await assertFinancePremium(tenantContext);
    const result = await new FinanceOpeningBalanceService(
      tenantContext
    ).getSetup();

    return apiSuccess(result);
  } catch (error: unknown) {
    if (error instanceof FinanceDomainError) {
      return apiError(
        error.code,
        error.message,
        getErrorStatus(error.code)
      );
    }

    console.error(
      '[GET /api/v1/dashboard/finance/onboarding/opening-balance]',
      error
    );
    return apiError(
      ErrorCodes.INTERNAL_ERROR,
      'Gagal memuat setup opening balance Finance.',
      500
    );
  }
}

export const PUT = withValidation(
  { body: FinanceOpeningBalanceDraftInputSchema },
  async (_request, { validatedBody }) => {
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
      await assertFinancePremium(tenantContext);
      const result = await new FinanceOpeningBalanceService(
        tenantContext
      ).saveDraft(validatedBody!);

      return apiSuccess(result);
    } catch (error: unknown) {
      if (error instanceof FinanceDomainError) {
        return apiError(
          error.code,
          error.message,
          getErrorStatus(error.code)
        );
      }

      console.error(
        '[PUT /api/v1/dashboard/finance/onboarding/opening-balance]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal menyimpan draft opening balance Finance.',
        500
      );
    }
  }
);
