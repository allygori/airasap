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
  FinanceSubledgerListQuerySchema,
  FinanceSubledgerService,
} from '@/modules/finance';

export const GET = withValidation(
  { query: FinanceSubledgerListQuerySchema },
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
      const result = await new FinanceSubledgerService(
        tenantContext
      ).listBalances(validatedQuery!);

      return apiSuccess(result);
    } catch (error: unknown) {
      return mapSubledgerError(
        error,
        'Gagal memuat saldo piutang dan hutang Finance.',
        '[GET /api/v1/dashboard/finance/receivables-and-payables]'
      );
    }
  }
);

function mapSubledgerError(
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
          : error.code ===
              'FINANCE_SUBLEDGER_SOURCE_NOT_FOUND'
            ? 404
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
