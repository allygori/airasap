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
  FinanceCashBankQuerySchema,
  FinanceCashBankReadService,
  FinanceDomainError,
} from '@/modules/finance';

export const GET = withValidation(
  { query: FinanceCashBankQuerySchema },
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

      const result = await new FinanceCashBankReadService(
        tenantContext
      ).list(validatedQuery!);

      return apiSuccess(result);
    } catch (error: unknown) {
      if (error instanceof FinanceDomainError) {
        const status =
          error.code === 'FINANCE_ORGANIZATION_NOT_FOUND'
            ? 404
            : error.code === 'FINANCE_NOT_ACTIVE'
              ? 403
              : 422;

        return apiError(error.code, error.message, status);
      }

      console.error(
        '[GET /api/v1/dashboard/finance/cash-and-bank]',
        error
      );

      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal memuat saldo Cash & Bank Finance.',
        500
      );
    }
  }
);
