/**
 * Active Orders Endpoint
 * GET /api/v1/dashboard/orders/active
 */

import { OrderService } from '@/modules/orders/order.service';
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
 * GET /api/v1/dashboard/orders/active
 * Get only active orders
 */
export const GET = withValidation({}, async (request) => {
  try {
    const tenantContext = getTenantContext(request);

    if (!tenantContext.organizationId) {
      return apiError(
        ErrorCodes.BAD_REQUEST,
        'Organization ID wajib diisi dalam header (x-organization-id)',
        400
      );
    }

    const orderService = new OrderService(tenantContext);
    const orders = await orderService.getActive();

    return apiSuccess(orders, {
      page: 1,
      limit: orders.length,
      total: orders.length,
      total_pages: 1,
    });
  } catch (error: any) {
    console.error('[GET /orders/active]', error);

    return apiError(
      ErrorCodes.INTERNAL_ERROR,
      error.message || 'Gagal mengambil produk aktif',
      500
    );
  }
});
