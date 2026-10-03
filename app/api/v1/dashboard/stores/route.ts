/**
 * Store API Routes
 * GET  /api/v1/dashboard/stores - List stores with pagination & filtering
 * POST /api/v1/dashboard/stores - Create new store
 */

import { StoreService } from '@/modules/stores/store.service';
import {
  CreateStoreSchema,
  CreateStoreDTO,
  StoreFilterSchema,
  StoreFilterDTO,
} from '@/modules/stores/store.dto';
import { withValidation } from '@/lib/api/validate';
import {
  apiSuccess,
  apiError,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import { getTenantContext } from '@/lib/api/tenant-context';

export const GET = withValidation(
  {
    query: StoreFilterSchema,
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

    const storeService = new StoreService(tenantContext);
    const validatedFilter =
      context.validatedQuery as StoreFilterDTO;

    const result =
      await storeService.getWithPagination(validatedFilter);

    return apiSuccess(result.data, {
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
      total_pages: result.pagination.totalPages,
    });
  }
);

export const POST = withValidation(
  CreateStoreSchema,
  async (_request, { validatedBody }) => {
    try {
      const tenantContext = await getTenantContext();

      if (!tenantContext.organizationId) {
        return apiError(
          ErrorCodes.BAD_REQUEST,
          'Organization ID tidak ditemukan',
          400
        );
      }

      await db.connect();

      const storeService = new StoreService(tenantContext);
      const body = validatedBody as CreateStoreDTO;
      const newStore = await storeService.create(body);

      return apiSuccess(newStore, undefined, 201);
    } catch {
      console.error('[POST /v1/dashboard/stores] failed');
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal membuat toko.',
        500
      );
    }
  }
);
