import mongoose from 'mongoose';
import { getTenantContext } from '@/lib/api/tenant-context';
import { withValidation } from '@/lib/api/validate';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import {
  FinanceDomainError,
  FinanceOpeningBalanceFinalizeInputSchema,
  FinanceOpeningBalanceService,
  type FinanceOpeningBalanceFinalizeResponseDTO,
} from '@/modules/finance';

export const POST = withValidation(
  { body: FinanceOpeningBalanceFinalizeInputSchema },
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
      const session = await mongoose.startSession();
      let result: FinanceOpeningBalanceFinalizeResponseDTO;
      try {
        result = await session.withTransaction(
          async (): Promise<FinanceOpeningBalanceFinalizeResponseDTO> =>
            new FinanceOpeningBalanceService(
              tenantContext
            ).finalize(validatedBody!, session)
        );
      } finally {
        await session.endSession();
      }

      return apiSuccess(
        result!,
        undefined,
        result!.replayed ? 200 : 201
      );
    } catch (error: unknown) {
      if (error instanceof FinanceDomainError) {
        const status =
          error.code === 'FINANCE_OWNER_REQUIRED'
            ? 403
            : error.code ===
                'FINANCE_ORGANIZATION_NOT_FOUND'
              ? 404
              : error.code ===
                    'FINANCE_ONBOARDING_ALREADY_COMPLETED' ||
                  error.code ===
                    'FINANCE_ONBOARDING_NOT_IN_PROGRESS' ||
                  error.code ===
                    'FINANCE_LIFECYCLE_CONFLICT' ||
                  error.code ===
                    'FINANCE_OPENING_BALANCE_DRAFT_REQUIRED' ||
                  error.code ===
                    'FINANCE_OPENING_BALANCE_FINALIZATION_FAILED'
                ? 409
                : 422;
        return apiError(error.code, error.message, status);
      }

      console.error(
        '[POST /api/v1/dashboard/finance/onboarding/opening-balance/finalize]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal mem-finalisasi opening balance Finance.',
        500
      );
    }
  }
);
