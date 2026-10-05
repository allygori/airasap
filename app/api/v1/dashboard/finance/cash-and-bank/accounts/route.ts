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
  FinanceCashBankAccountManagementInputSchema,
  FinanceCashBankAccountManagementService,
  FinanceDomainError,
} from '@/modules/finance';

export const GET = withValidation({}, async () => {
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
    const result =
      await new FinanceCashBankAccountManagementService(
        context
      ).listAccounts();

    return apiSuccess(result);
  } catch (error: unknown) {
    return mapManagementError(
      error,
      'Gagal memuat daftar rekening Finance.',
      '[GET /api/v1/dashboard/finance/cash-and-bank/accounts]'
    );
  }
});

export const POST = withValidation(
  { body: FinanceCashBankAccountManagementInputSchema },
  async (_request, { validatedBody }) => {
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
      const account =
        await new FinanceCashBankAccountManagementService(
          context
        ).createAccount(validatedBody!);

      return apiSuccess({ account }, undefined, 201);
    } catch (error: unknown) {
      return mapManagementError(
        error,
        'Gagal menambahkan rekening Finance.',
        '[POST /api/v1/dashboard/finance/cash-and-bank/accounts]'
      );
    }
  }
);

function mapManagementError(
  error: unknown,
  fallback: string,
  logContext: string
) {
  if (error instanceof FinanceDomainError) {
    const status =
      error.code === 'FINANCE_ORGANIZATION_NOT_FOUND' ||
      error.code === 'FINANCE_ACCOUNT_NOT_FOUND'
        ? 404
        : error.code === 'FINANCE_NOT_ACTIVE' ||
            error.code === 'FINANCE_OWNER_REQUIRED'
          ? 403
          : error.code ===
                'FINANCE_CASH_BANK_ACCOUNT_PAYOUT_DEFAULT' ||
              error.code ===
                'FINANCE_RECEIVING_ACCOUNT_REQUIRED'
            ? 409
            : 422;

    return apiError(error.code, error.message, status);
  }

  console.error(logContext);
  return apiError(ErrorCodes.INTERNAL_ERROR, fallback, 500);
}
