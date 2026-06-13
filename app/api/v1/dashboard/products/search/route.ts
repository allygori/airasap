/**
 * Product Search Endpoint
 * GET /api/v1/dashboard/products/search?q=keyword
 */

import { NextRequest } from 'next/server';
import { ProductService } from '@/modules/products/product.service';
import {
  ProductSearchQuerySchema,
  ProductSearchQueryDTO,
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
    query: ProductSearchQuerySchema,
  },
  async (request, context) => {
    const tenantContext = getTenantContext(request);

    if (!tenantContext.organizationId) {
      return apiError(
        ErrorCodes.BAD_REQUEST,
        'Organization ID wajib diisi dalam header (x-organization-id)',
        400
      );
    }

    const validatedQuery =
      context.validatedQuery as ProductSearchQueryDTO;

    const productService = new ProductService(
      tenantContext
    );
    const results = await productService.searchProducts(
      validatedQuery.q
    );

    return apiSuccess(results, {
      page: 1,
      limit: results.length,
      total: results.length,
      total_pages: 1,
    });
  }
);
