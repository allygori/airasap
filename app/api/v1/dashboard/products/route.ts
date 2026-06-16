/**
 * Product API Routes
 * GET  /api/v1/dashboard/products - List products with pagination & filtering
 * POST /api/v1/dashboard/products - Create new product
 */

// import { NextRequest } from 'next/server';
import { ProductService } from '@/modules/products/product.service';
import {
  CreateProductSchema,
  CreateProductDTO,
  ProductFilterSchema,
  ProductFilterDTO,
} from '@/modules/products/product.dto';
import { withValidation } from '@/lib/api/validate';
import {
  apiSuccess,
  apiError,
  ErrorCodes,
} from '@/lib/api/response';
import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';

export const GET = withValidation(
  {
    query: ProductFilterSchema,
  },
  async (request, context) => {
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

    const productService = new ProductService(
      tenantContext
    );
    const validatedFilter =
      context.validatedQuery as ProductFilterDTO;

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
  }
);

export const POST = withValidation(
  CreateProductSchema,
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

      const productService = new ProductService(
        tenantContext
      );
      const body = validatedBody as CreateProductDTO;
      const newProduct =
        await productService.createProduct(body);

      return apiSuccess(newProduct, undefined, 201);
    } catch (error: any) {
      console.error('[POST /products]', error);

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
