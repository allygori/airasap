import { getTenantContext } from '@/lib/api/tenant-context';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { withValidation } from '@/lib/api/validate';
import { db } from '@/lib/db/connection';
import { ExpenseService } from '@/modules/expenses/expenses/expense.service';
import { CreateExpenseSchema } from '@/modules/expenses/expenses/expense.schema';

export const POST = withValidation(
  CreateExpenseSchema,
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
      const result = await new ExpenseService(
        tenantContext
      ).record(validatedBody, tenantContext.userId);

      return apiSuccess(result, undefined, 201);
    } catch (error) {
      console.error(
        '[POST /api/v1/dashboard/expenses]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error
          ? error.message
          : 'Gagal mencatat expense.',
        500
      );
    }
  }
);
