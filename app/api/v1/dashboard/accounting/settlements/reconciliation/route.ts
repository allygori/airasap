import { z } from 'zod';
import { ORDER_PLATFORM_VALUES } from '@/constant/order-platform';
import { getTenantContext } from '@/lib/api/tenant-context';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import { withValidation } from '@/lib/api/validate';
import { AccountingDomainError } from '@/modules/accounting/accounting.error';
import { MarketplaceSettlementService } from '@/modules/accounting/settlements/settlement.service';

const QuerySchema = z.object({
  status: z
    .enum(['draft', 'posted', 'blocked', 'voided'])
    .optional(),
  settlement_stage: z
    .enum(['funds_released', 'payout_received'])
    .optional(),
  platform: z.enum(ORDER_PLATFORM_VALUES).optional(),
  source_file: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(25),
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
      const result = await new MarketplaceSettlementService(
        tenantContext
      ).getReconciliation(query);
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
        '[GET /api/v1/dashboard/accounting/settlements/reconciliation]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error
          ? error.message
          : 'Gagal memuat reconciliation settlement.',
        500
      );
    }
  }
);
