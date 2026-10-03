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
  FinanceSupplierCreateInputSchema,
  FinanceSupplierListQuerySchema,
  FinanceSupplierService,
} from '@/modules/finance';

export const GET = withValidation(
  { query: FinanceSupplierListQuerySchema },
  async (_request, { validatedQuery }) => {
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
      ).list(validatedQuery!);
      return apiSuccess(result);
    } catch (error: unknown) {
      return mapSupplierError(
        error,
        'Gagal memuat direktori supplier.',
        '[GET /api/v1/dashboard/finance/suppliers]'
      );
    }
  }
);

export const POST = withValidation(
  { body: FinanceSupplierCreateInputSchema },
  async (_request, { validatedBody }) => {
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
      ).create(validatedBody!);
      return apiSuccess(result, undefined, 201);
    } catch (error: unknown) {
      return mapSupplierError(
        error,
        'Gagal menyimpan supplier.',
        '[POST /api/v1/dashboard/finance/suppliers]'
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
