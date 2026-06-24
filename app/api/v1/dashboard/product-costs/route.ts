/**
 * Product Cost API Routes
 * POST /api/v1/dashboard/product-costs - Create new product cost
 */

import { ProductCostService } from '@/modules/product-costs/product-cost.service';
import {
  CreateProductCostSchema,
  CreateProductCostDTO,
} from '@/modules/product-costs/product-cost.dto';
import { withValidation } from '@/lib/api/validate';
import {
  apiSuccess,
  apiError,
  ErrorCodes,
} from '@/lib/api/response';
import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';

export const POST = withValidation(
  CreateProductCostSchema,
  async (request, { validatedBody }) => {
    try {
      const tenantContext = await getTenantContext();

      if (!tenantContext.organizationId) {
        return apiError(
          ErrorCodes.BAD_REQUEST,
          'Organization ID tidak ditemukan',
          400
        );
      }

      if (!tenantContext.storeId) {
        return apiError(
          ErrorCodes.BAD_REQUEST,
          'Store ID tidak ditemukan',
          400
        );
      }

      await db.connect();

      const productCostService = new ProductCostService(
        tenantContext
      );
      const body = validatedBody as CreateProductCostDTO;
      const newProductCost =
        await productCostService.create(body);

      return apiSuccess(newProductCost, undefined, 201);
    } catch (error: any) {
      console.error(
        '[POST /api/v1/dashboard/product-costs]',
        error
      );

      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error.message || 'Gagal membuat product cost',
        500
      );
    }
  }
);
