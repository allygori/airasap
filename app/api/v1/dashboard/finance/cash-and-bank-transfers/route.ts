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
  assertFinanceModuleActive,
  FinanceCashBankTransferInputSchema,
  FinanceCashBankTransferListQuerySchema,
  FinanceCashBankTransferReadService,
  FinanceCashBankTransferService,
  FinanceDomainError,
  type FinanceCashBankTransferResponseDTO,
} from '@/modules/finance';

export const POST = withValidation(
  { body: FinanceCashBankTransferInputSchema },
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
      await assertFinanceModuleActive(tenantContext);

      const session = await mongoose.startSession();
      let result: FinanceCashBankTransferResponseDTO;
      try {
        result = await session.withTransaction(
          async (): Promise<FinanceCashBankTransferResponseDTO> =>
            new FinanceCashBankTransferService(
              tenantContext
            ).post(validatedBody!, session)
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
          error.code === 'FINANCE_ORGANIZATION_NOT_FOUND'
            ? 404
            : error.code === 'FINANCE_NOT_ACTIVE'
              ? 403
              : error.code ===
                    'FINANCE_CASH_BANK_TRANSFER_IDEMPOTENCY_CONFLICT' ||
                  error.code ===
                    'FINANCE_CASH_BANK_TRANSFER_FINALIZATION_FAILED'
                ? 409
                : 422;

        return apiError(error.code, error.message, status);
      }

      console.error(
        '[POST /api/v1/dashboard/finance/cash-and-bank-transfers]',
        error
      );

      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal mem-posting transfer Kas & Bank Finance.',
        500
      );
    }
  }
);

export const GET = withValidation(
  { query: FinanceCashBankTransferListQuerySchema },
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
      await assertFinanceModuleActive(tenantContext);

      const result =
        await new FinanceCashBankTransferReadService(
          tenantContext
        ).list(validatedQuery!);

      return apiSuccess(result);
    } catch (error: unknown) {
      if (error instanceof FinanceDomainError) {
        const status =
          error.code === 'FINANCE_ORGANIZATION_NOT_FOUND'
            ? 404
            : error.code === 'FINANCE_NOT_ACTIVE'
              ? 403
              : 422;

        return apiError(error.code, error.message, status);
      }

      console.error(
        '[GET /api/v1/dashboard/finance/cash-and-bank-transfers]',
        error
      );

      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal memuat riwayat transfer Kas & Bank Finance.',
        500
      );
    }
  }
);
