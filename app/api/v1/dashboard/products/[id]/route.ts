/**
 * Product ID Routes
 * GET    /api/v1/dashboard/products/[id] - Get product by ID
 * PATCH  /api/v1/dashboard/products/[id] - Update product
 * DELETE /api/v1/dashboard/products/[id] - Delete product (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/modules/products/product.service';
import { UpdateProductSchema } from '@/modules/products/product.dto';
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
 * GET /api/v1/dashboard/products/[id]
 * Retrieve product by ID
 */
export async function GET(
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
    const product = await productService.getProductById(id);

    return apiSuccess(product);
  } catch (error: any) {
    console.error('[GET /products/:id]', error);

    if (error.message?.includes('tidak ditemukan')) {
      return apiError(
        ErrorCodes.NOT_FOUND,
        error.message,
        404
      );
    }

    return apiError(
      ErrorCodes.INTERNAL_ERROR,
      error.message || 'Gagal mengambil detail produk',
      500
    );
  }
}

/**
 * PATCH /api/v1/dashboard/products/[id]
 * Update product (partial update)
 */
export const PATCH = withValidation(
  UpdateProductSchema,
  async (request, { params, validatedBody }) => {
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
      const updatedProduct =
        await productService.updateProduct(
          id,
          validatedBody
        );

      return apiSuccess(updatedProduct);
    } catch (error: any) {
      console.error('[PATCH /products/:id]', error);

      if (error.message?.includes('tidak ditemukan')) {
        return apiError(
          ErrorCodes.NOT_FOUND,
          error.message,
          404
        );
      }

      if (error.message?.includes('sudah ada')) {
        return apiError(
          ErrorCodes.CONFLICT,
          error.message,
          409
        );
      }

      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error.message || 'Gagal memperbarui produk',
        500
      );
    }
  }
);

/**
 * PUT /api/v1/dashboard/products/[id]
 * Also handle PUT as PATCH (partial update)
 */
export const PUT = PATCH;

/**
 * DELETE /api/v1/dashboard/products/[id]
 * Soft delete product (sets deleted_at)
 */
export async function DELETE(
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
    const deletedProduct =
      await productService.deleteProduct(id);

    return apiSuccess(deletedProduct);
  } catch (error: any) {
    console.error('[DELETE /products/:id]', error);

    if (error.message?.includes('tidak ditemukan')) {
      return apiError(
        ErrorCodes.NOT_FOUND,
        error.message,
        404
      );
    }

    return apiError(
      ErrorCodes.INTERNAL_ERROR,
      error.message || 'Gagal menghapus produk',
      500
    );
  }
}
