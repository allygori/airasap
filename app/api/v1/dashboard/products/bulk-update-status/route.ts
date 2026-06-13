/**
 * Product Bulk Operations Endpoints
 */

import { NextRequest } from 'next/server';
import { ProductService } from '@/modules/products/product.service';
import { BulkUpdateStatusSchema } from '@/modules/products/product.dto';
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
 * POST /api/v1/dashboard/products/bulk-update-status
 * Update status (is_active) for multiple products
 *
 * Body:
 * ```json
 * {
 *   "product_ids": ["id1", "id2", "id3"],
 *   "is_active": true
 * }
 * ```
 */
export const POST = withValidation(
  BulkUpdateStatusSchema,
  async (request, { validatedBody }) => {
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
      const result =
        await productService.bulkUpdateStatus(
          validatedBody
        );

      return apiSuccess(result);
    } catch (error: any) {
      console.error(
        '[POST /products/bulk-update-status]',
        error
      );

      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error.message || 'Gagal update status produk',
        500
      );
    }
  }
);
