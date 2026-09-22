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
  FinanceSalesTransactionReadService,
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

export const GET = withValidation(
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

      const result =
        await new FinanceSalesTransactionReadService(
          tenantContext
        ).get(validatedParams!.transactionId);

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
              : 422;

        return apiError(error.code, error.message, status);
      }

      console.error(
        '[GET /api/v1/dashboard/finance/sales/:transactionId]',
        error
      );

      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal memuat detail transaksi sales Finance.',
        500
      );
    }
  }
);
