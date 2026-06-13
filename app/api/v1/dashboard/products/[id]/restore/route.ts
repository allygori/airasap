/**
 * Product Restore Endpoint
 * POST /api/v1/dashboard/products/[id]/restore
 */

import { NextRequest } from 'next/server';
import { ProductService } from '@/modules/products/product.service';
import {
  ProductIdParamsSchema,
  ProductIdParamsDTO,
} from '@/modules/products/product.dto';
import { withValidation } from '@/lib/api/validate';
import {
  apiSuccess,
  apiError,
  ErrorCodes,
} from '@/lib/api/response';

/**
 * Extract tenant context from request headers
 */
function getTenantContext(req: Request) {
  return {
    organizationId:
      req.headers.get('x-organization-id') || '',
    storeId: req.headers.get('x-store-id') || undefined,
  };
}

export const POST = withValidation(
  {
    params: ProductIdParamsSchema,
  },
  async (request, context) => {
    const validatedParams =
      context.validatedParams as ProductIdParamsDTO;
    const tenantContext = getTenantContext(request);

    if (!tenantContext.organizationId) {
      return apiError(
        ErrorCodes.BAD_REQUEST,
        'Organization ID wajib diisi dalam header (x-organization-id)',
        400
      );
    }

    const productService = new ProductService(
      tenantContext
    );
    const restoredProduct =
      await productService.restoreProduct(
        validatedParams.id
      );

    return apiSuccess(restoredProduct);
  }
);
