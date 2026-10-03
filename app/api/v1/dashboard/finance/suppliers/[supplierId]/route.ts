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
  FinanceSupplierService,
  FinanceSupplierUpdateInputSchema,
} from '@/modules/finance';

const SupplierParamsSchema = z.object({
  supplierId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/),
});

export const PATCH = withValidation(
  {
    params: SupplierParamsSchema,
    body: FinanceSupplierUpdateInputSchema,
  },
  async (_request, { validatedParams, validatedBody }) => {
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
      const result = await new FinanceSupplierService(
        context
      ).update(validatedParams!.supplierId, validatedBody!);
      return apiSuccess(result);
    } catch (error: unknown) {
      return mapSupplierError(
        error,
        'Gagal memperbarui supplier.',
        '[PATCH /api/v1/dashboard/finance/suppliers/:supplierId]'
      );
    }
  }
);

function mapSupplierError(
  error: unknown,
  fallback: string,
  logContext: string
) {
  if (error instanceof FinanceDomainError) {
    const status =
      error.code === 'FINANCE_ORGANIZATION_NOT_FOUND' ||
      error.code === 'FINANCE_SUPPLIER_NOT_FOUND'
        ? 404
        : error.code === 'FINANCE_NOT_ACTIVE'
          ? 403
          : 422;
    return apiError(error.code, error.message, status);
  }
  console.error(logContext);
  return apiError(ErrorCodes.INTERNAL_ERROR, fallback, 500);
}
