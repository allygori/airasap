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
  FinanceJournalLedgerQuerySchema,
  FinanceJournalReadService,
} from '@/modules/finance';

export const GET = withValidation(
  { query: FinanceJournalLedgerQuerySchema },
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

      const result = await new FinanceJournalReadService(
        tenantContext
      ).ledger(validatedQuery!);

      return apiSuccess(result);
    } catch (error) {
      if (error instanceof FinanceDomainError) {
        const status =
          error.code === 'FINANCE_ORGANIZATION_NOT_FOUND' ||
          error.code === 'FINANCE_ACCOUNT_NOT_FOUND'
            ? 404
            : error.code === 'FINANCE_NOT_ACTIVE'
              ? 403
              : 422;

        return apiError(error.code, error.message, status);
      }

      console.error(
        '[GET /api/v1/dashboard/finance/accounting/ledger]',
        error
      );

      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal memuat ledger Finance.',
        500
      );
    }
  }
);
