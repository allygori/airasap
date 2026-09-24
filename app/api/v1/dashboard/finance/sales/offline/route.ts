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
  FinanceOfflineSaleInputSchema,
  FinanceOfflineSaleService,
} from '@/modules/finance';

const handleFinanceError = (
  error: unknown,
  label: string
) => {
  if (error instanceof FinanceDomainError) {
    const status =
      error.code === 'FINANCE_ORGANIZATION_NOT_FOUND'
        ? 404
        : error.code === 'FINANCE_NOT_ACTIVE'
          ? 403
          : error.code ===
              'FINANCE_INVENTORY_NEGATIVE_STOCK'
            ? 409
            : 422;
    return apiError(error.code, error.message, status);
  }
  console.error(label, error);
  return apiError(
    ErrorCodes.INTERNAL_ERROR,
    'Permintaan penjualan offline Finance gagal diproses.',
    500
  );
};

export const POST = withValidation(
  { body: FinanceOfflineSaleInputSchema },
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
      const result = await new FinanceOfflineSaleService(
        tenantContext
      ).create(validatedBody!);
      return apiSuccess(result, undefined, 201);
    } catch (error: unknown) {
      return handleFinanceError(
        error,
        '[POST /api/v1/dashboard/finance/sales/offline]'
      );
    }
  }
);
