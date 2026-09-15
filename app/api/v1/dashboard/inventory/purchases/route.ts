import { getTenantContext } from '@/lib/api/tenant-context';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { withValidation } from '@/lib/api/validate';
import { db } from '@/lib/db/connection';
import { InventoryMovementService } from '@/modules/inventory/movements/inventory-movement.service';
import { CreateInventoryMovementSchema } from '@/modules/inventory/movements/inventory-movement.schema';

export const POST = withValidation(
  CreateInventoryMovementSchema,
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
      const result = await new InventoryMovementService(
        tenantContext
      ).purchase(validatedBody, tenantContext.userId);

      return apiSuccess(result, undefined, 201);
    } catch (error) {
      console.error(
        '[POST /api/v1/dashboard/inventory/purchases]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error
          ? error.message
          : 'Gagal mencatat pembelian inventory.',
        500
      );
    }
  }
);
