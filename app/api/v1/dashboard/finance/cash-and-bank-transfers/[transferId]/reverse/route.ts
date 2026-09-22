import mongoose from 'mongoose';
import { z } from 'zod';
import { getTenantContext } from '@/lib/api/tenant-context';
import { withValidation } from '@/lib/api/validate';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import {
  assertFinanceModuleActive,
  FinanceCashBankTransferService,
  FinanceDomainError,
  FinanceJournalReversalSchema,
  type FinanceCashBankTransferResponseDTO,
} from '@/modules/finance';

const FinanceCashBankTransferRouteParamsSchema = z
  .object({ transferId: z.string().trim().min(1) })
  .strict();

export const POST = withValidation(
  {
    body: FinanceJournalReversalSchema,
    params: FinanceCashBankTransferRouteParamsSchema,
  },
  async (_request, { validatedBody, validatedParams }) => {
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
      await assertFinanceModuleActive(tenantContext);

      const session = await mongoose.startSession();
      let result: FinanceCashBankTransferResponseDTO;
      try {
        result = await session.withTransaction(
          async (): Promise<FinanceCashBankTransferResponseDTO> =>
            new FinanceCashBankTransferService(
              tenantContext
            ).reverse(
              validatedParams!.transferId,
              validatedBody!,
              session
            )
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
          error.code === 'FINANCE_ORGANIZATION_NOT_FOUND' ||
          error.code ===
            'FINANCE_CASH_BANK_TRANSFER_NOT_FOUND'
            ? 404
            : error.code === 'FINANCE_NOT_ACTIVE'
              ? 403
              : error.code ===
                    'FINANCE_CASH_BANK_TRANSFER_REVERSAL_FINALIZATION_FAILED' ||
                  error.code ===
                    'FINANCE_JOURNAL_REVERSAL_CONFLICT' ||
                  error.code ===
                    'FINANCE_JOURNAL_REVERSAL_FINALIZATION_FAILED'
                ? 409
                : 422;

        return apiError(error.code, error.message, status);
      }

      console.error(
        '[POST /api/v1/dashboard/finance/cash-and-bank-transfers/:transferId/reverse]',
        error
      );

      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal melakukan reversal transfer Kas & Bank Finance.',
        500
      );
    }
  }
);
