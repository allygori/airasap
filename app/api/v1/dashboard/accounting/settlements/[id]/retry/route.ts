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
import { MarketplaceSettlementService } from '@/modules/accounting/settlements/settlement.service';

const ParamsSchema = z.object({
  id: z.string().min(1),
});

const RetrySettlementSchema = z.object({
  destination_account_id: z
    .string()
    .trim()
    .min(1)
    .optional(),
});

type RetrySettlementDTO = z.infer<
  typeof RetrySettlementSchema
>;

/**
 * POST /api/v1/dashboard/accounting/settlements/[id]/retry
 */
export const POST = withValidation(
  {
    body: RetrySettlementSchema,
    params: ParamsSchema,
  },
  async (_request, context) => {
    const params = context.validatedParams as z.infer<
      typeof ParamsSchema
    >;
    const body =
      context.validatedBody as RetrySettlementDTO;
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
      const service = new MarketplaceSettlementService(
        tenantContext
      );
      const result = await service.retry(params.id, {
        destination_account_id: body.destination_account_id,
      });
      return apiSuccess(result);
    } catch (error) {
      if (error instanceof AccountingDomainError) {
        const status =
          error.code === 'SETTLEMENT_NOT_FOUND' ? 404 : 422;
        return apiError(error.code, error.message, status);
      }
      console.error(
        '[POST /accounting/settlements/[id]/retry]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error
          ? error.message
          : 'Gagal mengulang settlement.',
        500
      );
    }
  }
);
