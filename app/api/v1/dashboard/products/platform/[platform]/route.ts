/**
 * Products by Platform Endpoint
 * GET /api/v1/dashboard/products/platform/[platform]
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
 * GET /api/v1/dashboard/products/platform/[platform]
 * Get products filtered by platform
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params;
    const tenantContext = getTenantContext(request);

    if (!tenantContext.organizationId) {
      return apiError(
        ErrorCodes.BAD_REQUEST,
        'Organization ID wajib diisi dalam header (x-organization-id)',
        400
      );
    }

    if (!platform || platform.trim().length === 0) {
      return apiError(
        ErrorCodes.BAD_REQUEST,
        'Platform tidak valid',
        400
      );
    }

    const productService = new ProductService(
      tenantContext
    );
    const products =
      await productService.getProductsByPlatform(platform);

    return apiSuccess(products, {
      page: 1,
      limit: products.length,
      total: products.length,
      total_pages: 1,
    });
  } catch (error: any) {
    console.error(
      '[GET /products/platform/:platform]',
      error
    );

    return apiError(
      ErrorCodes.INTERNAL_ERROR,
      error.message ||
        'Gagal mengambil produk dari platform',
      500
    );
  }
}
