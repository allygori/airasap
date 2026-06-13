/**
 * Product Search Endpoint
 * GET /api/v1/dashboard/products/search?q=keyword
 */

import { NextRequest } from 'next/server';
import { ProductService } from '@/modules/products/product.service';
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

/**
 * GET /api/v1/dashboard/products/search
 * Search products by name or product_id
 *
 * Query params:
 * - q: string (search query, required)
 */
export async function GET(request: NextRequest) {
  try {
    const tenantContext = getTenantContext(request);

    if (!tenantContext.organizationId) {
      return apiError(
        ErrorCodes.BAD_REQUEST,
        'Organization ID wajib diisi dalam header (x-organization-id)',
        400
      );
    }

    const query = request.nextUrl.searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return apiError(
        ErrorCodes.BAD_REQUEST,
        'Search query (q) wajib diisi',
        400
      );
    }

    const productService = new ProductService(
      tenantContext
    );
    const results =
      await productService.searchProducts(query);

    return apiSuccess(results, {
      page: 1,
      limit: results.length,
      total: results.length,
      total_pages: 1,
    });
  } catch (error: any) {
    console.error('[GET /products/search]', error);

    return apiError(
      ErrorCodes.INTERNAL_ERROR,
      error.message || 'Gagal mencari produk',
      500
    );
  }
}
