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
  FinanceDomainError,
  FinanceCashLoanService,
} from '@/modules/finance';

const RouteParamsSchema = z
  .object({ loanId: z.string().trim().min(1) })
  .strict();

export const POST = withValidation(
  { params: RouteParamsSchema },
  async (_request, { validatedParams }) => {
    try {
      const context = await getTenantContext();
      if (!context.organizationId) {
        return apiError(
          ErrorCodes.FORBIDDEN,
          'Organization ID tidak ditemukan.',
          403
        );
      }
      await db.connect();
      await assertFinanceModuleActive(context);
      const result = await new FinanceCashLoanService(
        context
      ).post(validatedParams!.loanId);
      return apiSuccess(
        result,
        undefined,
        result.replayed ? 200 : 201
      );
    } catch (error: unknown) {
      if (error instanceof FinanceDomainError) {
        const status =
          error.code === 'FINANCE_ORGANIZATION_NOT_FOUND' ||
          error.code === 'FINANCE_CASH_LOAN_NOT_FOUND' ||
          error.code ===
            'FINANCE_CASH_LOAN_LENDER_NOT_FOUND'
            ? 404
            : error.code === 'FINANCE_NOT_ACTIVE'
              ? 403
              : error.code ===
                    'FINANCE_CASH_LOAN_FINALIZATION_FAILED' ||
                  error.code ===
                    'FINANCE_CASH_LOAN_REPAYMENT_EXCEEDS_BALANCE'
                ? 409
                : 422;
        return apiError(error.code, error.message, status);
      }
      console.error(
        '[POST /api/v1/dashboard/finance/cash-loans/:loanId/post]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal mem-posting transaksi pinjaman Finance.',
        500
      );
    }
  }
);
