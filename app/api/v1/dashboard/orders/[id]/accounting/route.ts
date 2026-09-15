import { z } from 'zod';
import { db } from '@/lib/db/connection';
import { withValidation } from '@/lib/api/validate';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { getTenantContext } from '@/lib/api/tenant-context';
import { AccountingDomainError } from '@/modules/accounting/accounting.error';
import {
  OrderIdParamsDTO,
  OrderIdParamsSchema,
} from '@/modules/orders/order.dto';
import { OrderService } from '@/modules/orders/order.service';

const PostOrderAccountingSchema = z.object({
  location_id: z.string().trim().min(1).optional(),
});

type PostOrderAccountingDTO = z.infer<
  typeof PostOrderAccountingSchema
>;

/**
 * POST /api/v1/dashboard/orders/[id]/accounting
 * Post a completed order to marketplace receivable, revenue,
 * inventory movements, and COGS journals.
 */
export const POST = withValidation(
  {
    body: PostOrderAccountingSchema,
    params: OrderIdParamsSchema,
  },
  async (request, context) => {
    const params =
      context.validatedParams as OrderIdParamsDTO;
    const body =
      context.validatedBody as PostOrderAccountingDTO;
    const tenantContext = await getTenantContext();

    if (!tenantContext.organizationId) {
      return apiError(
        ErrorCodes.BAD_REQUEST,
        'Organization ID tidak ditemukan.',
        400
      );
    }

    try {
      await db.connect();
      const orderService = new OrderService(tenantContext);
      const result =
        await orderService.postCompletedOrderToAccounting(
          params.id,
          body.location_id
        );
      return apiSuccess(result);
    } catch (error) {
      if (error instanceof AccountingDomainError) {
        const status =
          error.code === 'ORDER_NOT_FOUND' ? 404 : 422;
        return apiError(error.code, error.message, status);
      }

      console.error(
        '[POST /orders/[id]/accounting]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error
          ? error.message
          : 'Gagal mengintegrasikan order ke accounting.',
        500
      );
    }
  }
);
