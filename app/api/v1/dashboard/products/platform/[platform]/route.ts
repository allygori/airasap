/**
 * Products by Platform Endpoint
 * GET /api/v1/dashboard/products/platform/[platform]
 */

import { NextRequest } from 'next/server';
import { ProductService } from '@/modules/products/product.service';
import {
  ProductPlatformParamsSchema,
  ProductPlatformParamsDTO,
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

export const GET = withValidation(
  {
    params: ProductPlatformParamsSchema,
  },
  async (request, context) => {
    const validatedParams =
      context.validatedParams as ProductPlatformParamsDTO;
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
    const products =
      await productService.getProductsByPlatform(
        validatedParams.platform
      );

    return apiSuccess(products, {
      page: 1,
      limit: products.length,
      total: products.length,
      total_pages: 1,
    });
  }
);
