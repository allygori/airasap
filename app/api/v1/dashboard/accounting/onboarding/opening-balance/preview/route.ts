import { getTenantContext } from '@/lib/api/tenant-context';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import { withValidation } from '@/lib/api/validate';
import { AccountingDomainError } from '@/modules/accounting/accounting.error';
import { AccountingOnboardingService } from '@/modules/accounting/accounting-onboarding.service';
import { AccountingOnboardingFinalizeSchema } from '@/modules/accounting/onboarding.schema';

export const POST = withValidation(
  AccountingOnboardingFinalizeSchema,
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
      const result = await new AccountingOnboardingService(
        tenantContext
      ).previewOpeningBalance(validatedBody);
      return apiSuccess(result);
    } catch (error) {
      if (error instanceof AccountingDomainError) {
        const status =
          error.code === 'ACCOUNTING_OWNER_REQUIRED'
            ? 403
            : error.code === 'ONBOARDING_ALREADY_COMPLETED'
              ? 409
              : 422;
        return apiError(error.code, error.message, status);
      }
      console.error(
        '[POST /api/v1/dashboard/accounting/onboarding/opening-balance/preview]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error
          ? error.message
          : 'Gagal memuat preview opening balance onboarding.',
        500
      );
    }
  }
);
