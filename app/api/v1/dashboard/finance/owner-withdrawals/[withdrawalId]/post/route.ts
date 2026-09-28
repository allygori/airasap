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
  FinanceDomainError,
  FinanceOwnerWithdrawalService,
} from '@/modules/finance';

const RouteParamsSchema = z
  .object({ withdrawalId: z.string().trim().min(1) })
  .strict();

export const POST = withValidation(
  { params: RouteParamsSchema },
  async (_request, { validatedParams }) => {
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
        ).post(validatedParams!.withdrawalId);

      return apiSuccess(
        result,
        undefined,
        result.replayed ? 200 : 201
      );
    } catch (error: unknown) {
      if (error instanceof FinanceDomainError) {
        const status =
          error.code === 'FINANCE_ORGANIZATION_NOT_FOUND' ||
          error.code ===
            'FINANCE_OWNER_WITHDRAWAL_NOT_FOUND'
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

      console.error(
        '[POST /api/v1/dashboard/finance/owner-withdrawals/:withdrawalId/post]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal mem-posting penarikan pemilik Finance.',
        500
      );
    }
  }
);
