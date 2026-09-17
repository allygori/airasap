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
import { AccountingOnboardingService } from '@/modules/accounting/accounting-onboarding.service';

const QuerySchema = z.object({
  store_id: z.string().trim().min(1).optional(),
  offset: z.coerce
    .number()
    .int()
    .min(0)
    .max(100000)
    .default(0),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(200)
    .default(100),
});

export const GET = withValidation(
  { query: QuerySchema },
  async (_request, { validatedQuery }) => {
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
      const query = validatedQuery as z.infer<
        typeof QuerySchema
      >;
      const result = await new AccountingOnboardingService(
        tenantContext
      ).previewInventory({
        storeId: query.store_id,
        offset: query.offset,
        limit: query.limit,
      });
      return apiSuccess(result);
    } catch (error) {
      if (error instanceof AccountingDomainError) {
        const status =
          error.code === 'ACCOUNTING_OWNER_REQUIRED'
            ? 403
            : error.code === 'ONBOARDING_ALREADY_COMPLETED'
              ? 409
              : 422;
        return apiError(error.code, error.message, status);
      }
      console.error(
        '[GET /api/v1/dashboard/accounting/onboarding/inventory/preview]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error
          ? error.message
          : 'Gagal memuat preview inventory onboarding.',
        500
      );
    }
  }
);
