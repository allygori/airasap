/**
 * Product Cost ID Routes
 * PATCH  /api/v1/dashboard/product-costs/[id] - Update product cost
 * DELETE /api/v1/dashboard/product-costs/[id] - Delete product cost (soft delete)
 */

import { ProductCostService } from '@/modules/product-costs/product-cost.service';
import {
  UpdateProductCostSchema,
  UpdateProductCostDTO,
} from '@/modules/product-costs/product-cost.dto';
import { withValidation } from '@/lib/api/validate';
import {
  apiSuccess,
  apiError,
  ErrorCodes,
} from '@/lib/api/response';
import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';
import { z } from 'zod';

const IdParamSchema = z.object({
  id: z.string().min(1, 'ID tidak valid'),
});

export const PATCH = withValidation(
  {
    body: UpdateProductCostSchema,
    params: IdParamSchema,
  },
  async (request, context) => {
    try {
      const validatedBody =
        context.validatedBody as UpdateProductCostDTO;
      const validatedParams = context.validatedParams as {
        id: string;
      };
      const tenantContext = await getTenantContext();

      await db.connect();

      const productCostService = new ProductCostService(
        tenantContext
      );
      const updated = await productCostService.update(
        validatedParams.id,
        validatedBody
      );

      return apiSuccess(updated);
    } catch (error: any) {
      console.error(
        '[PATCH /api/v1/dashboard/product-costs/[id]]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error.message || 'Gagal memperbarui product cost',
        500
      );
    }
  }
);

export const DELETE = withValidation(
  {
    params: IdParamSchema,
  },
  async (request, context) => {
    try {
      const validatedParams = context.validatedParams as {
        id: string;
      };
      const tenantContext = await getTenantContext();

      await db.connect();

      const productCostService = new ProductCostService(
        tenantContext
      );
      const deleted = await productCostService.remove(
        validatedParams.id
      );

      return apiSuccess(deleted);
    } catch (error: any) {
      console.error(
        '[DELETE /api/v1/dashboard/product-costs/[id]]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error.message || 'Gagal menghapus product cost',
        500
      );
    }
  }
);
