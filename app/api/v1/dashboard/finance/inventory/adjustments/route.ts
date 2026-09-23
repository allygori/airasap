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
  FinanceInventoryAdjustmentSchema,
  FinanceInventoryAdjustmentService,
  type FinanceInventoryAdjustmentResponseDTO,
} from '@/modules/finance';

export const POST = withValidation(
  { body: FinanceInventoryAdjustmentSchema },
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

      const result: FinanceInventoryAdjustmentResponseDTO =
        await new FinanceInventoryAdjustmentService(
          tenantContext
        ).post(validatedBody!);

      return apiSuccess(result);
    } catch (error: unknown) {
      if (error instanceof FinanceDomainError) {
        const notFoundCodes = new Set([
          'FINANCE_ORGANIZATION_NOT_FOUND',
          'FINANCE_INVENTORY_ITEM_NOT_FOUND',
          'FINANCE_INVENTORY_LOCATION_NOT_FOUND',
        ]);
        const conflictCodes = new Set([
          'FINANCE_INVENTORY_NEGATIVE_STOCK',
          'FINANCE_INVENTORY_BALANCE_UNRESOLVED',
          'FINANCE_INVENTORY_BALANCE_COST_MISSING',
          'FINANCE_INVENTORY_ADJUSTMENT_IDEMPOTENCY_CONFLICT',
          'FINANCE_INVENTORY_ADJUSTMENT_FINALIZATION_FAILED',
        ]);
        const status =
          error.code === 'FINANCE_NOT_ACTIVE'
            ? 403
            : notFoundCodes.has(error.code)
              ? 404
              : conflictCodes.has(error.code)
                ? 409
                : 422;

        return apiError(error.code, error.message, status);
      }

      console.error(
        '[POST /api/v1/dashboard/finance/inventory/adjustments]',
        error
      );

      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal mem-posting adjustment inventory Finance.',
        500
      );
    }
  }
);
