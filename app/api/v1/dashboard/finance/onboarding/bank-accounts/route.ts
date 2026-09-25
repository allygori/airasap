import { getTenantContext } from '@/lib/api/tenant-context';
import { withValidation } from '@/lib/api/validate';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import {
  assertFinancePremium,
  FinanceBankAccountCreateInputSchema,
  FinanceBankAccountOnboardingService,
  FinanceDomainError,
} from '@/modules/finance';

export const POST = withValidation(
  { body: FinanceBankAccountCreateInputSchema },
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
      await assertFinancePremium(tenantContext);
      const result =
        await new FinanceBankAccountOnboardingService(
          tenantContext
        ).create(validatedBody!);

      return apiSuccess(result);
    } catch (error: unknown) {
      if (error instanceof FinanceDomainError) {
        const status =
          error.code === 'FINANCE_OWNER_REQUIRED' ||
          error.code === 'FINANCE_NOT_ACTIVE'
            ? 403
            : error.code ===
                'FINANCE_ORGANIZATION_NOT_FOUND'
              ? 404
              : error.code ===
                    'FINANCE_ONBOARDING_NOT_IN_PROGRESS' ||
                  error.code ===
                    'FINANCE_ONBOARDING_ALREADY_COMPLETED'
                ? 409
                : error.code ===
                    'FINANCE_BANK_ACCOUNT_CREATE_FAILED'
                  ? 500
                  : 422;

        return apiError(error.code, error.message, status);
      }

      console.error(
        '[POST /api/v1/dashboard/finance/onboarding/bank-accounts]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal menambahkan rekening bank Finance.',
        500
      );
    }
  }
);
