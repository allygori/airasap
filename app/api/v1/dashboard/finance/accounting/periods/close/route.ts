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
  FinanceLifecycleService,
  FinanceClosePeriodSchema,
  FinancePeriodService,
} from '@/modules/finance';

export const POST = withValidation(
  { body: FinanceClosePeriodSchema },
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
      await new FinanceLifecycleService(
        tenantContext
      ).assertOwner();

      const period = await new FinancePeriodService(
        tenantContext
      ).close(validatedBody!, tenantContext.userId);

      return apiSuccess({ period }, undefined, 201);
    } catch (error) {
      if (error instanceof FinanceDomainError) {
        const status =
          error.code === 'FINANCE_ORGANIZATION_NOT_FOUND'
            ? 404
            : error.code === 'FINANCE_NOT_ACTIVE' ||
                error.code === 'FINANCE_OWNER_REQUIRED'
              ? 403
              : error.code ===
                    'FINANCE_PERIOD_ALREADY_CLOSED' ||
                  error.code ===
                    'FINANCE_PERIOD_CLOSE_CONFLICT'
                ? 409
                : 422;

        return apiError(error.code, error.message, status);
      }

      console.error(
        '[POST /api/v1/dashboard/finance/accounting/periods/close]',
        error
      );

      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal menutup period Finance.',
        500
      );
    }
  }
);
