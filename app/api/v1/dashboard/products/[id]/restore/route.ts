/**
 * Product Restore Endpoint
 * POST /api/v1/dashboard/products/[id]/restore
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
 * POST /api/v1/dashboard/products/[id]/restore
 * Restore soft-deleted product
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantContext = getTenantContext(request);

    if (!tenantContext.organizationId) {
      return apiError(
        ErrorCodes.BAD_REQUEST,
        'Organization ID wajib diisi dalam header (x-organization-id)',
        400
      );
    }

    if (!id || id.trim().length === 0) {
      return apiError(
        ErrorCodes.BAD_REQUEST,
        'Product ID tidak valid',
        400
      );
    }

    const productService = new ProductService(
      tenantContext
    );
    const restoredProduct =
      await productService.restoreProduct(id);

    return apiSuccess(restoredProduct);
  } catch (error: any) {
    console.error('[POST /products/:id/restore]', error);

    if (error.message?.includes('tidak ditemukan')) {
      return apiError(
        ErrorCodes.NOT_FOUND,
        error.message,
        404
      );
    }

    return apiError(
      ErrorCodes.INTERNAL_ERROR,
      error.message || 'Gagal memulihkan produk',
      500
    );
  }
}
