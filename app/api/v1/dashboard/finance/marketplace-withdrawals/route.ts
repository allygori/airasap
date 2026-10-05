import { getTenantContext } from '@/lib/api/tenant-context';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { withValidation } from '@/lib/api/validate';
import { db } from '@/lib/db/connection';
import {
  assertFinanceModuleActive,
  FinanceDomainError,
  FinanceMarketplaceWithdrawalInputSchema,
  FinanceCashBankTransferService,
} from '@/modules/finance';

export const POST = withValidation(
  { body: FinanceMarketplaceWithdrawalInputSchema },
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

      const result =
        await new FinanceCashBankTransferService(
          tenantContext
        ).postMarketplaceWithdrawal(validatedBody!);

      return apiSuccess(
        result,
        undefined,
        result.replayed ? 200 : 201
      );
    } catch (error: unknown) {
      if (error instanceof FinanceDomainError) {
        const status =
          error.code === 'FINANCE_ORGANIZATION_NOT_FOUND'
            ? 404
            : error.code === 'FINANCE_NOT_ACTIVE'
              ? 403
              : error.code ===
                    'FINANCE_CASH_BANK_TRANSFER_IDEMPOTENCY_CONFLICT' ||
                  error.code ===
                    'FINANCE_CASH_BANK_TRANSFER_FINALIZATION_FAILED'
                ? 409
                : 422;

        return apiError(error.code, error.message, status);
      }

      console.error(
        '[POST /api/v1/dashboard/finance/marketplace-withdrawals]',
        error
      );

      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal mem-posting penarikan Marketplace.',
        500
      );
    }
  }
);
