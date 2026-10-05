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
  FinanceCashBankAccountActiveInputSchema,
  FinanceCashBankAccountManagementService,
  FinanceDomainError,
} from '@/modules/finance';

const ParamsSchema = z
  .object({
    accountId: z.string().regex(/^[a-f\d]{24}$/i),
  })
  .strict();

export const PATCH = withValidation(
  {
    body: FinanceCashBankAccountActiveInputSchema,
    params: ParamsSchema,
  },
  async (_request, { validatedBody, validatedParams }) => {
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
      const account =
        await new FinanceCashBankAccountManagementService(
          context
        ).setAccountActive(
          validatedParams!.accountId,
          validatedBody!
        );

      return apiSuccess({ account });
    } catch (error: unknown) {
      return mapManagementError(
        error,
        'Gagal mengubah status rekening Finance.',
        '[PATCH /api/v1/dashboard/finance/cash-and-bank/accounts/:accountId/status]'
      );
    }
  }
);

function mapManagementError(
  error: unknown,
  fallback: string,
  logContext: string
) {
  if (error instanceof FinanceDomainError) {
    const status =
      error.code === 'FINANCE_ORGANIZATION_NOT_FOUND' ||
      error.code === 'FINANCE_ACCOUNT_NOT_FOUND'
        ? 404
        : error.code === 'FINANCE_NOT_ACTIVE' ||
            error.code === 'FINANCE_OWNER_REQUIRED'
          ? 403
          : error.code ===
                'FINANCE_CASH_BANK_ACCOUNT_PAYOUT_DEFAULT' ||
              error.code ===
                'FINANCE_RECEIVING_ACCOUNT_REQUIRED'
            ? 409
            : 422;

    return apiError(error.code, error.message, status);
  }

  console.error(logContext);
  return apiError(ErrorCodes.INTERNAL_ERROR, fallback, 500);
}
