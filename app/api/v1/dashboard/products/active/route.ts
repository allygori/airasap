/**
 * Active Products Endpoint
 * GET /api/v1/dashboard/products/active
 */

import { ProductService } from '@/modules/products/product.service';
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

/**
 * GET /api/v1/dashboard/products/active
 * Get only active products
 */
export const GET = withValidation({}, async (request) => {
  try {
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
      await productService.getActiveProducts();

    return apiSuccess(products, {
      page: 1,
      limit: products.length,
      total: products.length,
      total_pages: 1,
    });
  } catch (error: any) {
    console.error('[GET /products/active]', error);

    return apiError(
      ErrorCodes.INTERNAL_ERROR,
      error.message || 'Gagal mengambil produk aktif',
      500
    );
  }
});
