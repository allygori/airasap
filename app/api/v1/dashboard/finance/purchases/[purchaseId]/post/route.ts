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
  FinancePurchaseService,
  type FinancePurchaseResponseDTO,
} from '@/modules/finance';

const PurchaseRouteParamsSchema = z
  .object({ purchaseId: z.string().trim().min(1) })
  .strict();

export const POST = withValidation(
  { params: PurchaseRouteParamsSchema },
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
      const result: FinancePurchaseResponseDTO =
        await new FinancePurchaseService(
          tenantContext
        ).post(validatedParams!.purchaseId);

      return apiSuccess(
        result,
        undefined,
        result.replayed ? 200 : 201
      );
    } catch (error: unknown) {
      if (error instanceof FinanceDomainError) {
        const status =
          error.code === 'FINANCE_ORGANIZATION_NOT_FOUND' ||
          error.code === 'FINANCE_PURCHASE_NOT_FOUND' ||
          error.code ===
            'FINANCE_PURCHASE_ITEM_NOT_FOUND' ||
          error.code ===
            'FINANCE_PURCHASE_LOCATION_NOT_FOUND'
            ? 404
            : error.code === 'FINANCE_NOT_ACTIVE'
              ? 403
              : error.code ===
                  'FINANCE_PURCHASE_FINALIZATION_FAILED'
                ? 409
                : 422;
        return apiError(error.code, error.message, status);
      }

      console.error(
        '[POST /api/v1/dashboard/finance/purchases/:purchaseId/post]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal mem-posting purchase Finance.',
        500
      );
    }
  }
);
