/**
 * Product API Routes
 * GET  /api/v1/dashboard/products - List products with pagination & filtering
 * POST /api/v1/dashboard/products - Create new product
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/modules/products/product.service';
import {
  CreateProductSchema,
  ProductFilterSchema,
} from '@/modules/products/product.dto';
import { withValidation } from '@/lib/api/validate';
import {
  apiSuccess,
  apiError,
  ErrorCodes,
} from '@/lib/api/response';
import { parseQueryParams } from '@/lib/api/query-builder';

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
 * GET /api/v1/dashboard/products
 * List products dengan pagination dan filtering
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 10, max: 100)
 * - platform: string (filter by platform)
 * - is_active: boolean (filter by status)
 * - search: string (search by name or product_id)
 * - sort: string (e.g., "-created_at" for descending)
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

    // Parse query parameters
    const queryParams = parseQueryParams(request, {
      allowedFilters: ['platform', 'is_active'],
      searchFields: ['name', 'product_id'],
    });

    // Validasi query parameters
    const validatedFilter = ProductFilterSchema.parse({
      page: queryParams.page,
      limit: queryParams.limit,
      platform: queryParams.filters.platform,
      is_active:
        queryParams.filters.is_active === 'true'
          ? true
          : queryParams.filters.is_active === 'false'
            ? false
            : undefined,
      search: queryParams.search,
    });

    const productService = new ProductService(
      tenantContext
    );
    const result =
      await productService.getProductsWithPagination(
        validatedFilter
      );

    return apiSuccess(result.data, {
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
      total_pages: result.pagination.totalPages,
    });
  } catch (error: any) {
    console.error('[GET /products]', error);

    if (error.name === 'ZodError') {
      return apiError(
        ErrorCodes.VALIDATION_ERROR,
        'Parameter query tidak valid',
        400,
        error.errors.map((e: any) => ({
          path: e.path.join('.'),
          message: e.message,
        }))
      );
    }

    return apiError(
      ErrorCodes.INTERNAL_ERROR,
      error.message || 'Gagal mengambil daftar produk',
      500
    );
  }
}

/**
 * POST /api/v1/dashboard/products
 * Create new product
 *
 * Required header:
 * - x-organization-id: Organization ID (required)
 * - x-store-id: Store ID (optional)
 *
 * Body:
 * ```json
 * {
 *   "name": "Product Name",
 *   "product_id": "unique-id",
 *   "platform": "shopee",
 *   "key": "product-key",
 *   "is_active": true,
 *   "variants": [...]
 * }
 * ```
 */
export const POST = withValidation(
  CreateProductSchema,
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
      const newProduct =
        await productService.createProduct(validatedBody);

      return apiSuccess(newProduct, undefined, 201);
    } catch (error: any) {
      console.error('[POST /products]', error);

      // Handle duplicate product_id
      if (error.message?.includes('sudah ada')) {
        return apiError(
          ErrorCodes.CONFLICT,
          error.message,
          409
        );
      }

      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error.message || 'Gagal membuat produk',
        500
      );
    }
  }
);
