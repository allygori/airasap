/**
 * Order ID Routes
 * GET    /api/v1/dashboard/orders/[id] - Get order by ID
 * PATCH  /api/v1/dashboard/orders/[id] - Update order
 * DELETE /api/v1/dashboard/orders/[id] - Delete order (soft delete)
 */

import { NextRequest } from 'next/server';
import { OrderService } from '@/modules/orders/order.service';
import {
  UpdateOrderDTO,
  UpdateOrderSchema,
  OrderIdParamsSchema,
  OrderIdParamsDTO,
} from '@/modules/orders/order.dto';
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
 * GET /api/v1/dashboard/orders/[id]
 * Retrieve order by ID
 */
export const GET = withValidation(
  {
    params: OrderIdParamsSchema,
  },
  async (request, context) => {
    const validatedParams =
      context.validatedParams as OrderIdParamsDTO;
    const tenantContext = getTenantContext(request);

    if (!tenantContext.organizationId) {
      return apiError(
        ErrorCodes.BAD_REQUEST,
        'Organization ID wajib diisi dalam header (x-organization-id)',
        400
      );
    }

    const orderService = new OrderService(tenantContext);
    const order = await orderService.getById(
      validatedParams.id
    );

    return apiSuccess(order);
  }
);

/**
 * PATCH /api/v1/dashboard/orders/[id]
 * Update order (partial update)
 */
export const PATCH = withValidation(
  {
    body: UpdateOrderSchema,
    params: OrderIdParamsSchema,
  },
  async (request, context) => {
    const validatedBody =
      context.validatedBody as UpdateOrderDTO;
    const validatedParams =
      context.validatedParams as OrderIdParamsDTO;
    const tenantContext = getTenantContext(request);

    const orderService = new OrderService(tenantContext);
    const updatedOrder = await orderService.update(
      validatedParams.id,
      validatedBody
    );

    return apiSuccess(updatedOrder);
  }
);

/**
 * PUT /api/v1/dashboard/orders/[id]
 * Also handle PUT as PATCH (partial update)
 */
export const PUT = PATCH;

/**
 * DELETE /api/v1/dashboard/orders/[id]
 * Soft delete order (sets deleted_at)
 */
export const DELETE = withValidation(
  {
    params: OrderIdParamsSchema,
  },
  async (request, context) => {
    const validatedParams =
      context.validatedParams as OrderIdParamsDTO;
    const tenantContext = getTenantContext(request);

    const orderService = new OrderService(tenantContext);
    const deletedOrder = await orderService.remove(
      validatedParams.id
    );

    return apiSuccess(deletedOrder);
  }
);
