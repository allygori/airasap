import { getTenantContext } from '@/lib/api/tenant-context';
import { apiError, ErrorCodes } from '@/lib/api/response';
import { withValidation } from '@/lib/api/validate';
import { AccountingCutoverSchema } from '@/modules/accounting/accounting-cutover.schema';

export const POST = withValidation(
  AccountingCutoverSchema,
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

      return apiError(
        'ACCOUNTING_ONBOARDING_REQUIRED',
        'Cutover harus dilakukan melalui accounting onboarding agar lifecycle, inventory opening, dan idempotency diproses bersama.',
        409
      );
    } catch (error) {
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error
          ? error.message
          : 'Gagal menyiapkan accounting cutover.',
        500
      );
    }
  }
);
