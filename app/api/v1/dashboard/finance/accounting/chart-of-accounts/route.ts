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
  FinanceAccountService,
  FinanceAccountFilterSchema,
  FinanceDomainError,
} from '@/modules/finance';

export const GET = withValidation(
  { query: FinanceAccountFilterSchema },
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

      const result = await new FinanceAccountService(
        tenantContext
      ).list(validatedQuery!);

      return apiSuccess(result);
    } catch (error) {
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
        '[GET /api/v1/dashboard/finance/accounting/chart-of-accounts]',
        error
      );

      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal memuat Chart of Accounts.',
        500
      );
    }
  }
);
