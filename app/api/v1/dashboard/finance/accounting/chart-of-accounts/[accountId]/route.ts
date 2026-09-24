import { z } from 'zod';
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
  FinanceDomainError,
  FinanceAccountUpdateDetailsSchema,
} from '@/modules/finance';

const ParamsSchema = z
  .object({
    accountId: z.string().regex(/^[a-f\d]{24}$/i),
  })
  .strict();

export const PATCH = withValidation(
  {
    body: FinanceAccountUpdateDetailsSchema,
    params: ParamsSchema,
  },
  async (_request, { validatedBody, validatedParams }) => {
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

      const account = await new FinanceAccountService(
        tenantContext
      ).updateDetails(
        validatedParams!.accountId,
        validatedBody!
      );

      return apiSuccess({ account });
    } catch (error: unknown) {
      if (error instanceof FinanceDomainError) {
        const status =
          error.code === 'FINANCE_ORGANIZATION_NOT_FOUND' ||
          error.code === 'FINANCE_ACCOUNT_NOT_FOUND'
            ? 404
            : error.code === 'FINANCE_NOT_ACTIVE' ||
                error.code ===
                  'FINANCE_SYSTEM_ACCOUNT_READ_ONLY'
              ? 403
              : 422;

        return apiError(error.code, error.message, status);
      }

      console.error(
        '[PATCH /api/v1/dashboard/finance/accounting/chart-of-accounts/:accountId]',
        error
      );

      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal mengubah akun Finance.',
        500
      );
    }
  }
);
