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

const PayoutSchema = z.object({
  destination_account_id: z.string().trim().min(1),
  payout_at: z.string().min(1),
  payout_reference: z.string().trim().min(1),
  amount: z.number().int().positive().optional(),
  source_file: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
});

export const POST = withValidation(
  {
    body: PayoutSchema,
    params: ParamsSchema,
  },
  async (_request, context) => {
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
      const params = context.validatedParams as z.infer<
        typeof ParamsSchema
      >;
      const body = context.validatedBody as z.infer<
        typeof PayoutSchema
      >;
      const result = await new MarketplaceSettlementService(
        tenantContext
      ).recordPayout(params.id, body);
      return apiSuccess(result, undefined, 201);
    } catch (error) {
      if (error instanceof AccountingDomainError) {
        const status =
          error.code === 'SETTLEMENT_NOT_FOUND'
            ? 404
            : error.code === 'PAYOUT_IDEMPOTENCY_CONFLICT'
              ? 409
              : error.code === 'ACCOUNTING_NOT_ACTIVE'
                ? 409
                : 422;
        return apiError(error.code, error.message, status);
      }
      console.error(
        '[POST /accounting/settlements/[id]/payout]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error
          ? error.message
          : 'Gagal mencatat payout marketplace.',
        500
      );
    }
  }
);
