import { getTenantContext } from '@/lib/api/tenant-context';
import { withValidation } from '@/lib/api/validate';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import {
  assertFinanceModuleActive,
  FinanceDomainError,
  FinancePurchaseInputSchema,
  FinancePurchaseListQuerySchema,
  FinancePurchaseReadService,
  FinancePurchaseService,
} from '@/modules/finance';

export const POST = withValidation(
  { body: FinancePurchaseInputSchema },
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
      await assertFinanceModuleActive(tenantContext);
      const result = await new FinancePurchaseService(
        tenantContext
      ).createDraft(validatedBody!);

      return apiSuccess(
        result,
        undefined,
        result.replayed ? 200 : 201
      );
    } catch (error: unknown) {
      return mapPurchaseError(
        error,
        'Gagal menyimpan draft purchase Finance.',
        '[POST /api/v1/dashboard/finance/purchases]'
      );
    }
  }
);

export const GET = withValidation(
  { query: FinancePurchaseListQuerySchema },
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
      await assertFinanceModuleActive(tenantContext);
      const result = await new FinancePurchaseReadService(
        tenantContext
      ).list(validatedQuery!);

      return apiSuccess(result);
    } catch (error: unknown) {
      return mapPurchaseError(
        error,
        'Gagal memuat daftar purchase Finance.',
        '[GET /api/v1/dashboard/finance/purchases]'
      );
    }
  }
);

function mapPurchaseError(
  error: unknown,
  fallbackMessage: string,
  logContext: string
) {
  if (error instanceof FinanceDomainError) {
    const status =
      error.code === 'FINANCE_ORGANIZATION_NOT_FOUND'
        ? 404
        : error.code === 'FINANCE_NOT_ACTIVE'
          ? 403
          : error.code === 'FINANCE_PURCHASE_NOT_FOUND' ||
              error.code ===
                'FINANCE_PURCHASE_ITEM_NOT_FOUND' ||
              error.code ===
                'FINANCE_PURCHASE_LOCATION_NOT_FOUND'
            ? 404
            : error.code ===
                'FINANCE_PURCHASE_IDEMPOTENCY_CONFLICT'
              ? 409
              : 422;

    return apiError(error.code, error.message, status);
  }

  console.error(logContext, error);
  return apiError(
    ErrorCodes.INTERNAL_ERROR,
    fallbackMessage,
    500
  );
}
