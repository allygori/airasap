import { getTenantContext } from '@/lib/api/tenant-context';
import { withValidation } from '@/lib/api/validate';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import {
  assertFinancePremium,
  FinanceDomainError,
  FinanceInventorySetupActionSchema,
  FinanceInventorySetupQuerySchema,
  FinanceInventorySetupService,
} from '@/modules/finance';

const getErrorStatus = (code: string) => {
  if (code === 'FINANCE_ORGANIZATION_NOT_FOUND') return 404;
  if (
    code === 'FINANCE_NOT_ACTIVE' ||
    code === 'FINANCE_OWNER_REQUIRED'
  ) {
    return 403;
  }
  if (
    code === 'FINANCE_INVENTORY_PRODUCT_NOT_FOUND' ||
    code === 'FINANCE_INVENTORY_ITEM_NOT_FOUND' ||
    code === 'FINANCE_INVENTORY_LOCATION_NOT_FOUND' ||
    code === 'FINANCE_INVENTORY_VARIANT_NOT_FOUND'
  ) {
    return 404;
  }
  if (
    code === 'FINANCE_INVENTORY_ITEM_SKU_CONFLICT' ||
    code === 'FINANCE_INVENTORY_PRODUCT_ALREADY_MAPPED'
  ) {
    return 409;
  }
  return 422;
};

export const GET = withValidation(
  { query: FinanceInventorySetupQuerySchema },
  async (_request, { validatedQuery }) => {
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
      await assertFinancePremium(tenantContext);
      const result = await new FinanceInventorySetupService(
        tenantContext
      ).getSetup(validatedQuery!);

      return apiSuccess(result);
    } catch (error: unknown) {
      if (error instanceof FinanceDomainError) {
        return apiError(
          error.code,
          error.message,
          getErrorStatus(error.code)
        );
      }

      console.error(
        '[GET /api/v1/dashboard/finance/inventory/setup]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal memuat setup inventory Finance.',
        500
      );
    }
  }
);

export const POST = withValidation(
  { body: FinanceInventorySetupActionSchema },
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
      await assertFinancePremium(tenantContext);
      const result = await new FinanceInventorySetupService(
        tenantContext
      ).perform(validatedBody!);

      return apiSuccess(result);
    } catch (error: unknown) {
      if (error instanceof FinanceDomainError) {
        return apiError(
          error.code,
          error.message,
          getErrorStatus(error.code)
        );
      }

      console.error(
        '[POST /api/v1/dashboard/finance/inventory/setup]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal menyimpan setup inventory Finance.',
        500
      );
    }
  }
);
