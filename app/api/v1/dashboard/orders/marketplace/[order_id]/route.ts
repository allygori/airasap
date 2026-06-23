/**
 * Order ID Routes
 * GET    /api/v1/dashboard/orders/[order_id] - Get order by marketplace order ID
 * PATCH  /api/v1/dashboard/orders/[order_id] - Update order by marketplace order ID
 * DELETE /api/v1/dashboard/orders/[order_id] - Delete order (soft delete) by marketplace order ID
 */

import { NextRequest } from 'next/server';
import { OrderService } from '@/modules/orders/order.service';
import {
  UpdateOrderDTO,
  UpdateOrderSchema,
  PlatformOrderIdParamsDTO,
  PlatformOrderIdParamsSchema,
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

/**
 * GET /api/v1/dashboard/orders/marketplace/[order_id]
 * Retrieve order by platform order ID
 */
export const GET = withValidation(
  {
    params: PlatformOrderIdParamsSchema,
    query: OrderFilterSchema,
  },
  async (request, context) => {
    const validatedParams =
      context.validatedParams as PlatformOrderIdParamsDTO;
    const validatedQuery =
      context.validatedQuery as OrderFilterDTO;
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

    const orderService = new OrderService(tenantContext);
    const order = await orderService.getByOrderId(
      validatedParams.order_id,
      validatedQuery?.populate
    );

    return apiSuccess(order);
  }
);

/**
 * PATCH /api/v1/dashboard/orders/[order_id]
 * Update order (partial update)
 */
export const PATCH = withValidation(
  {
    body: UpdateOrderSchema,
    params: PlatformOrderIdParamsSchema,
  },
  async (request, context) => {
    const validatedBody =
      context.validatedBody as UpdateOrderDTO;
    const validatedParams =
      context.validatedParams as PlatformOrderIdParamsDTO;
    const tenantContext = await getTenantContext();

    const orderService = new OrderService(tenantContext);
    const updatedOrder = await orderService.update(
      validatedParams.order_id,
      validatedBody
    );

    return apiSuccess(updatedOrder);
  }
);

/**
 * PUT /api/v1/dashboard/orders/[order_id]
 * Also handle PUT as PATCH (partial update)
 */
export const PUT = PATCH;

/**
 * DELETE /api/v1/dashboard/orders/[order_id]
 * Soft delete order (sets deleted_at)
 */
export const DELETE = withValidation(
  {
    params: PlatformOrderIdParamsSchema,
  },
  async (request, context) => {
    const validatedParams =
      context.validatedParams as PlatformOrderIdParamsDTO;
    const tenantContext = await getTenantContext();

    const orderService = new OrderService(tenantContext);
    const deletedOrder = await orderService.remove(
      validatedParams.order_id
    );

    return apiSuccess(deletedOrder);
  }
);
