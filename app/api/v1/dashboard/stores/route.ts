/**
 * Store API Routes
 * GET  /api/v1/dashboard/stores - List stores with pagination & filtering
 * POST /api/v1/dashboard/stores - Create new store
 */

import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
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
import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db/connection';

async function getTenantContext(req: Request) {
  // return {
  //   organizationId:
  //     req.headers.get('x-organization-id') || '',
  //   storeId: req.headers.get('x-store-id') || undefined,
  // };

  const session = await auth.api.getSession({
    headers: await headers(), // Forward Next.js headers to Better Auth
  });

  return {
    organizationId:
      session?.session?.activeOrganizationId || '',
    // storeId: req.headers.get('x-store-id') || undefined,
  };
}

export const GET = withValidation(
  {
    query: StoreFilterSchema,
  },
  async (request, context) => {
    const tenantContext = await getTenantContext(request);

    if (!tenantContext.organizationId) {
      return apiError(
        ErrorCodes.BAD_REQUEST,
        'Organization ID wajib diisi dalam header (x-organization-id)',
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
  async (request, { validatedBody }) => {
    try {
      const tenantContext = await getTenantContext(request);

      if (!tenantContext.organizationId) {
        return apiError(
          ErrorCodes.BAD_REQUEST,
          'Organization ID wajib diisi dalam header (x-organization-id)',
          400
        );
      }

      await db.connect();

      const storeService = new StoreService(tenantContext);
      const body = validatedBody as CreateStoreDTO;
      const newStore = await storeService.create(body);

      return apiSuccess(newStore, undefined, 201);
    } catch (error: any) {
      console.error('[POST /stores]', error);

      if (error.message?.includes('sudah ada')) {
        return apiError(
          ErrorCodes.CONFLICT,
          error.message,
          409
        );
      }

      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error.message || 'Gagal membuat toko',
        500
      );
    }
  }
);
