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
  FinanceSalesWorkflowService,
  type FinanceSalesCogsRetryResultDTO,
} from '@/modules/finance';

const FinanceSalesTransactionRouteParamsSchema = z
  .object({
    transactionId: z
      .string()
      .regex(
        /^[0-9a-fA-F]{24}$/,
        'Transaction ID tidak valid'
      ),
  })
  .strict();

export const POST = withValidation(
  { params: FinanceSalesTransactionRouteParamsSchema },
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

      const result: FinanceSalesCogsRetryResultDTO =
        await new FinanceSalesWorkflowService(
          tenantContext
        ).retryDeferredCogs(validatedParams!.transactionId);

      return apiSuccess(result);
    } catch (error: unknown) {
      if (error instanceof FinanceDomainError) {
        const status =
          error.code === 'FINANCE_ORGANIZATION_NOT_FOUND' ||
          error.code ===
            'FINANCE_SALES_TRANSACTION_NOT_FOUND'
            ? 404
            : error.code === 'FINANCE_NOT_ACTIVE'
              ? 403
              : error.code ===
                    'FINANCE_SALES_COGS_NOT_RETRYABLE' ||
                  error.code ===
                    'FINANCE_INVENTORY_COGS_FINALIZATION_FAILED' ||
                  error.code ===
                    'FINANCE_JOURNAL_IDEMPOTENCY_CONFLICT' ||
                  error.code ===
                    'FINANCE_PERIOD_NOT_OPEN' ||
                  error.code ===
                    'FINANCE_PERIOD_ALREADY_CLOSED'
                ? 409
                : 422;

        return apiError(error.code, error.message, status);
      }

      console.error(
        '[POST /api/v1/dashboard/finance/sales/:transactionId/retry-cogs]',
        error
      );

      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal mencoba ulang HPP transaksi sales Finance.',
        500
      );
    }
  }
);
