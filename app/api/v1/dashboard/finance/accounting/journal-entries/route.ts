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
  FinanceJournalListQuerySchema,
  FinanceJournalReadService,
  FinanceJournalService,
  FinanceOperationalPostingSchema,
} from '@/modules/finance';

export const POST = withValidation(
  { body: FinanceOperationalPostingSchema },
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

      const result = await new FinanceJournalService(
        tenantContext
      ).postOperational(validatedBody!);

      return apiSuccess(
        result,
        undefined,
        result.replayed ? 200 : 201
      );
    } catch (error) {
      if (error instanceof FinanceDomainError) {
        const status =
          error.code === 'FINANCE_ORGANIZATION_NOT_FOUND'
            ? 404
            : error.code === 'FINANCE_NOT_ACTIVE'
              ? 403
              : error.code ===
                    'FINANCE_JOURNAL_IDEMPOTENCY_CONFLICT' ||
                  error.code ===
                    'FINANCE_JOURNAL_CREATE_CONFLICT'
                ? 409
                : 422;

        return apiError(error.code, error.message, status);
      }

      console.error(
        '[POST /api/v1/dashboard/finance/accounting/journal-entries]',
        error
      );

      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal membuat journal Finance.',
        500
      );
    }
  }
);

export const GET = withValidation(
  { query: FinanceJournalListQuerySchema },
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
        '[GET /api/v1/dashboard/finance/accounting/journal-entries]',
        error
      );

      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal memuat journal Finance.',
        500
      );
    }
  }
);
