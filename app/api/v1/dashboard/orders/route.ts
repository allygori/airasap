/**
 * Order API Routes
 * GET  /api/v1/dashboard/orders - List orders with pagination & filtering
 * POST /api/v1/dashboard/orders - Create new order
 */

// import { NextRequest } from 'next/server';
import { OrderService } from '@/modules/orders/order.service';
import {
  CreateOrderSchema,
  CreateOrderDTO,
  OrderFilterSchema,
  OrderFilterDTO,
} from '@/modules/orders/order.dto';
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
    query: OrderFilterSchema,
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

    // console.log({ tenantContext });

    await db.connect();

    const orderService = new OrderService(tenantContext);
    const validatedFilter =
      context.validatedQuery as OrderFilterDTO;

    const result =
      await orderService.getWithPagination(validatedFilter);

    return apiSuccess(result.data, {
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
      total_pages: result.pagination.totalPages,
    });
  }
);

export const POST = withValidation(
  CreateOrderSchema,
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

      const orderService = new OrderService(tenantContext);
      const body = validatedBody as CreateOrderDTO;
      const newOrder = await orderService.create(body);

      return apiSuccess(newOrder, undefined, 201);
    } catch (error: any) {
      console.error(
        '[POST /api/v1/dashboard/orders]',
        error
      );

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
