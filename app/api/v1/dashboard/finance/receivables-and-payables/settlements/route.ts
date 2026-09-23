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
  FinanceSettlementInputSchema,
  FinanceSubledgerService,
  type FinanceSettlementResponseDTO,
} from '@/modules/finance';

export const POST = withValidation(
  { body: FinanceSettlementInputSchema },
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
      const result: FinanceSettlementResponseDTO =
        await new FinanceSubledgerService(
          tenantContext
        ).settle(validatedBody!);

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
                  'FINANCE_SUBLEDGER_SOURCE_NOT_FOUND'
                ? 404
                : error.code ===
                      'FINANCE_SETTLEMENT_IDEMPOTENCY_CONFLICT' ||
                    error.code ===
                      'FINANCE_SETTLEMENT_AMOUNT_EXCEEDS_BALANCE' ||
                    error.code ===
                      'FINANCE_SETTLEMENT_FINALIZATION_FAILED'
                  ? 409
                  : 422;
        return apiError(error.code, error.message, status);
      }

      console.error(
        '[POST /api/v1/dashboard/finance/receivables-and-payables/settlements]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal mem-posting settlement Finance.',
        500
      );
    }
  }
);
