/**
 * Order Restore Endpoint
 * POST /api/v1/dashboard/orders/[id]/restore
 */

import { NextRequest } from 'next/server';
import { OrderService } from '@/modules/orders/order.service';
import {
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

export const POST = withValidation(
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
    const restoredOrder = await orderService.restore(
      validatedParams.id
    );

    return apiSuccess(restoredOrder);
  }
);
