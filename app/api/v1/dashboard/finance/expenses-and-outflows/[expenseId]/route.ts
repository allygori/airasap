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
  FinanceExpenseReadService,
} from '@/modules/finance';

const ExpenseRouteParamsSchema = z
  .object({ expenseId: z.string().trim().min(1) })
  .strict();

export const GET = withValidation(
  { params: ExpenseRouteParamsSchema },
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
      const result = await new FinanceExpenseReadService(
        tenantContext
      ).get(validatedParams!.expenseId);

      return apiSuccess(result);
    } catch (error: unknown) {
      if (error instanceof FinanceDomainError) {
        const status =
          error.code === 'FINANCE_ORGANIZATION_NOT_FOUND' ||
          error.code === 'FINANCE_EXPENSE_NOT_FOUND'
            ? 404
            : error.code === 'FINANCE_NOT_ACTIVE'
              ? 403
              : 422;
        return apiError(error.code, error.message, status);
      }

      console.error(
        '[GET /api/v1/dashboard/finance/expenses-and-outflows/:expenseId]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal memuat detail expense Finance.',
        500
      );
    }
  }
);
