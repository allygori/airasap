/**
 * Product ID Routes
 * GET    /api/v1/dashboard/products/[id] - Get product by ID
 * PATCH  /api/v1/dashboard/products/[id] - Update product
 * DELETE /api/v1/dashboard/products/[id] - Delete product (soft delete)
 */

import { NextRequest } from 'next/server';
import { ProductService } from '@/modules/products/product.service';
import {
  UpdateProductDTO,
  UpdateProductSchema,
  ProductIdParamsSchema,
  ProductIdParamsDTO,
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

/**
 * GET /api/v1/dashboard/products/[id]
 * Retrieve product by ID
 */
export const GET = withValidation(
  {
    params: ProductIdParamsSchema,
  },
  async (request, context) => {
    const validatedParams =
      context.validatedParams as ProductIdParamsDTO;
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
    const product = await productService.getProductById(
      validatedParams.id
    );

    return apiSuccess(product);
  }
);

/**
 * PATCH /api/v1/dashboard/products/[id]
 * Update product (partial update)
 */
export const PATCH = withValidation(
  {
    body: UpdateProductSchema,
    params: ProductIdParamsSchema,
  },
  async (request, context) => {
    const validatedBody =
      context.validatedBody as UpdateProductDTO;
    const validatedParams =
      context.validatedParams as ProductIdParamsDTO;
    const tenantContext = getTenantContext(request);

    const productService = new ProductService(
      tenantContext
    );
    const updatedProduct =
      await productService.updateProduct(
        validatedParams.id,
        validatedBody
      );

    return apiSuccess(updatedProduct);
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
export const DELETE = withValidation(
  {
    params: ProductIdParamsSchema,
  },
  async (request, context) => {
    const validatedParams =
      context.validatedParams as ProductIdParamsDTO;
    const tenantContext = getTenantContext(request);

    const productService = new ProductService(
      tenantContext
    );
    const deletedProduct =
      await productService.deleteProduct(
        validatedParams.id
      );

    return apiSuccess(deletedProduct);
  }
);
