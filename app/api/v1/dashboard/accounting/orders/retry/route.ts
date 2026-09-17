import { z } from 'zod';
import { getTenantContext } from '@/lib/api/tenant-context';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import { withValidation } from '@/lib/api/validate';
import { AccountingDomainError } from '@/modules/accounting/accounting.error';
import { AccountingOrderRetryService } from '@/modules/accounting/order-accounting-retry.service';

const RetryOrdersSchema = z.object({
  limit: z.number().int().min(1).max(100).default(25),
  location_id: z.string().trim().min(1).optional(),
});

export const POST = withValidation(
  RetryOrdersSchema,
  async (_request, { validatedBody }) => {
    try {
      const tenantContext = await getTenantContext();
      if (!tenantContext.organizationId) {
        return apiError(
          ErrorCodes.FORBIDDEN,
          'Organization ID tidak ditemukan.',
          403
        );
      }
      await db.connect();
      const body = validatedBody as z.infer<
        typeof RetryOrdersSchema
      >;
      const result = await new AccountingOrderRetryService(
        tenantContext
      ).retry({
        limit: body.limit,
        locationId: body.location_id,
      });
      return apiSuccess(result);
    } catch (error) {
      if (error instanceof AccountingDomainError) {
        const status =
          error.code === 'ACCOUNTING_NOT_ACTIVE'
            ? 409
            : 422;
        return apiError(error.code, error.message, status);
      }
      console.error(
        '[POST /api/v1/dashboard/accounting/orders/retry]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error
          ? error.message
          : 'Gagal mengulang integrasi order.',
        500
      );
    }
  }
);
