import { db } from '@/lib/db/connection';
import { getTenantContext } from '@/lib/api/tenant-context';
import { withValidation } from '@/lib/api/validate';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import {
  ProductIdParamsDTO,
  ProductIdParamsSchema,
} from '@/modules/products/product.dto';
import { ProductService } from '@/modules/products/product.service';

export const POST = withValidation(
  { params: ProductIdParamsSchema },
  async (_request, context) => {
    const params =
      context.validatedParams as ProductIdParamsDTO;
    const tenantContext = await getTenantContext();

    if (!tenantContext.organizationId) {
      return apiError(
        ErrorCodes.UNAUTHORIZED,
        'Sesi organisasi tidak ditemukan.',
        401
      );
    }

    if (!tenantContext.userId) {
      return apiError(
        ErrorCodes.UNAUTHORIZED,
        'Sesi pengguna tidak ditemukan.',
        401
      );
    }

    try {
      await db.connect();
      const productService = new ProductService(
        tenantContext
      );
      const product =
        await productService.markProductReviewed(
          params.id,
          tenantContext.userId
        );

      return apiSuccess(product);
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message ===
          'Produk tidak ditemukan untuk ditinjau'
      ) {
        return apiError(
          ErrorCodes.NOT_FOUND,
          'Produk tidak ditemukan.',
          404
        );
      }

      console.error('[POST /products/:id/review]', error);
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal menyelesaikan review produk.',
        500
      );
    }
  }
);
