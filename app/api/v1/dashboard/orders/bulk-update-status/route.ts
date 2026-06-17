/**
 * Order Bulk Operations Endpoints
 */

import { OrderService } from '@/modules/orders/order.service';
import {
  BulkUpdateStatusSchema,
  BulkUpdateStatusDTO,
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
 * POST /api/v1/dashboard/orders/bulk-update-status
 * Update status (is_active) for multiple orders
 *
 * Body:
 * ```json
 * {
 *   "order_ids": ["id1", "id2", "id3"],
 *   "is_active": true
 * }
 * ```
 */
export const POST = withValidation<
  BulkUpdateStatusDTO,
  unknown,
  unknown
>(
  {
    body: BulkUpdateStatusSchema,
  },
  async (request, { validatedBody }) => {
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
      const result = await orderService.bulkUpdateStatus(
        validatedBody!
      );

      return apiSuccess(result);
    } catch (error: any) {
      console.error(
        '[POST /orders/bulk-update-status]',
        error
      );

      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error.message || 'Gagal update status produk',
        500
      );
    }
  }
);
