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
  FinanceCashLoanInputSchema,
  FinanceCashLoanListQuerySchema,
  FinanceCashLoanReadService,
  FinanceCashLoanService,
} from '@/modules/finance';

export const GET = withValidation(
  { query: FinanceCashLoanListQuerySchema },
  async (_request, { validatedQuery }) => {
    try {
      const context = await getTenantContext();
      if (!context.organizationId) {
        return apiError(
          ErrorCodes.FORBIDDEN,
          'Organization ID tidak ditemukan.',
          403
        );
      }
      await db.connect();
      await assertFinanceModuleActive(context);
      const result = await new FinanceCashLoanReadService(
        context
      ).list(validatedQuery!);
      return apiSuccess(result);
    } catch (error: unknown) {
      return mapCashLoanError(
        error,
        'Gagal memuat transaksi pinjaman tunai Finance.',
        '[GET /api/v1/dashboard/finance/cash-loans]'
      );
    }
  }
);

export const POST = withValidation(
  { body: FinanceCashLoanInputSchema },
  async (_request, { validatedBody }) => {
    try {
      const context = await getTenantContext();
      if (!context.organizationId) {
        return apiError(
          ErrorCodes.FORBIDDEN,
          'Organization ID tidak ditemukan.',
          403
        );
      }
      await db.connect();
      await assertFinanceModuleActive(context);
      const result = await new FinanceCashLoanService(
        context
      ).createDraft(validatedBody!);
      return apiSuccess(
        result,
        undefined,
        result.replayed ? 200 : 201
      );
    } catch (error: unknown) {
      return mapCashLoanError(
        error,
        'Gagal menyimpan transaksi pinjaman tunai Finance.',
        '[POST /api/v1/dashboard/finance/cash-loans]'
      );
    }
  }
);

function mapCashLoanError(
  error: unknown,
  fallbackMessage: string,
  logContext: string
) {
  if (error instanceof FinanceDomainError) {
    const status =
      error.code === 'FINANCE_ORGANIZATION_NOT_FOUND' ||
      error.code === 'FINANCE_CASH_LOAN_NOT_FOUND' ||
      error.code === 'FINANCE_CASH_LOAN_LENDER_NOT_FOUND'
        ? 404
        : error.code === 'FINANCE_NOT_ACTIVE'
          ? 403
          : error.code ===
                'FINANCE_CASH_LOAN_IDEMPOTENCY_CONFLICT' ||
              error.code ===
                'FINANCE_CASH_LOAN_FINALIZATION_FAILED'
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
