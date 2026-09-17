import { z } from 'zod';
import { getTenantContext } from '@/lib/api/tenant-context';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { withValidation } from '@/lib/api/validate';
import { db } from '@/lib/db/connection';
import { AccountingDomainError } from '@/modules/accounting/accounting.error';
import { AccountingReconstructionService } from '@/modules/accounting/reconstruction.service';

const ParamsSchema = z.object({
  id: z.string().min(1),
});

const BodySchema = z.object({
  location_id: z.string().optional(),
});

export const POST = withValidation(
  {
    body: BodySchema,
    params: ParamsSchema,
  },
  async (_request, context) => {
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
      const params = context.validatedParams as z.infer<
        typeof ParamsSchema
      >;
      const body = context.validatedBody as z.infer<
        typeof BodySchema
      >;
      const result =
        await new AccountingReconstructionService(
          tenantContext
        ).reconstructOrder(params.id, body);
      return apiSuccess(result, undefined, 201);
    } catch (error) {
      if (error instanceof AccountingDomainError) {
        const status =
          error.code === 'ACCOUNTING_OWNER_REQUIRED'
            ? 403
            : error.code === 'ORDER_NOT_FOUND'
              ? 404
              : 422;
        return apiError(error.code, error.message, status);
      }
      console.error(
        '[POST /api/v1/dashboard/accounting/reconstruction/orders/[id]]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error
          ? error.message
          : 'Gagal melakukan reconstruction order.',
        500
      );
    }
  }
);
