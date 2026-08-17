/**
 * Overwrite Order by ID Routes
 * PATCH  /api/v1/dashboard/orders/[id]/overwrite - Update order
 * PUT    /api/v1/dashboard/orders/[id]/overwrite - Update order
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
import { getTenantContext } from '@/lib/api/tenant-context';

/**
 * PATCH /api/v1/dashboard/orders/[id]/overwrite
 * Update order (partial update)
 */
export const PATCH = withValidation(
  {
    params: OrderIdParamsSchema,
    body: UpdateOrderSchema,
  },
  async (request, context) => {
    const validatedBody =
      context.validatedBody as UpdateOrderDTO;
    const validatedParams =
      context.validatedParams as OrderIdParamsDTO;
    const tenantContext = await getTenantContext();

    const orderService = new OrderService(tenantContext);
    const updatedOrder = await orderService.overwrite(
      // validatedParams.id,
      validatedBody
    );

    return apiSuccess(updatedOrder);
  }
);

/**
 * PUT /api/v1/dashboard/orders/[id]/overwrite
 * Also handle PUT as PATCH (partial update)
 */
export const PUT = PATCH;
