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
  FinanceExpenseInputSchema,
  FinanceExpenseListQuerySchema,
  FinanceExpenseReadService,
  FinanceExpenseService,
} from '@/modules/finance';

export const POST = withValidation(
  { body: FinanceExpenseInputSchema },
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
      const result = await new FinanceExpenseService(
        tenantContext
      ).createDraft(validatedBody!);

      return apiSuccess(
        result,
        undefined,
        result.replayed ? 200 : 201
      );
    } catch (error: unknown) {
      return mapExpenseError(
        error,
        'Gagal menyimpan draft expense Finance.',
        '[POST /api/v1/dashboard/finance/expenses-and-outflows]'
      );
    }
  }
);

export const GET = withValidation(
  { query: FinanceExpenseListQuerySchema },
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
      const result = await new FinanceExpenseReadService(
        tenantContext
      ).list(validatedQuery!);

      return apiSuccess(result);
    } catch (error: unknown) {
      return mapExpenseError(
        error,
        'Gagal memuat daftar expense Finance.',
        '[GET /api/v1/dashboard/finance/expenses-and-outflows]'
      );
    }
  }
);

function mapExpenseError(
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
          : error.code === 'FINANCE_EXPENSE_NOT_FOUND'
            ? 404
            : error.code ===
                'FINANCE_EXPENSE_IDEMPOTENCY_CONFLICT'
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
