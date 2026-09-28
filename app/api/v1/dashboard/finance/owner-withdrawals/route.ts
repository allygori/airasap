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
  FinanceOwnerWithdrawalInputSchema,
  FinanceOwnerWithdrawalListQuerySchema,
  FinanceOwnerWithdrawalReadService,
  FinanceOwnerWithdrawalService,
} from '@/modules/finance';

export const GET = withValidation(
  { query: FinanceOwnerWithdrawalListQuerySchema },
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
      const result =
        await new FinanceOwnerWithdrawalReadService(
          tenantContext
        ).list(validatedQuery!);

      return apiSuccess(result);
    } catch (error: unknown) {
      return mapOwnerWithdrawalError(
        error,
        'Gagal memuat riwayat penarikan pemilik Finance.',
        '[GET /api/v1/dashboard/finance/owner-withdrawals]'
      );
    }
  }
);

export const POST = withValidation(
  { body: FinanceOwnerWithdrawalInputSchema },
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
      const result =
        await new FinanceOwnerWithdrawalService(
          tenantContext
        ).createDraft(validatedBody!);

      return apiSuccess(
        result,
        undefined,
        result.replayed ? 200 : 201
      );
    } catch (error: unknown) {
      return mapOwnerWithdrawalError(
        error,
        'Gagal menyimpan draft penarikan pemilik Finance.',
        '[POST /api/v1/dashboard/finance/owner-withdrawals]'
      );
    }
  }
);

function mapOwnerWithdrawalError(
  error: unknown,
  fallbackMessage: string,
  logContext: string
) {
  if (error instanceof FinanceDomainError) {
    const status =
      error.code === 'FINANCE_ORGANIZATION_NOT_FOUND' ||
      error.code === 'FINANCE_OWNER_WITHDRAWAL_NOT_FOUND'
        ? 404
        : error.code === 'FINANCE_NOT_ACTIVE'
          ? 403
          : error.code ===
                'FINANCE_OWNER_WITHDRAWAL_IDEMPOTENCY_CONFLICT' ||
              error.code ===
                'FINANCE_OWNER_WITHDRAWAL_FINALIZATION_FAILED'
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
