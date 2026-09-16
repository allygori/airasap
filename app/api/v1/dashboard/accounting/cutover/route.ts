import { getTenantContext } from '@/lib/api/tenant-context';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { withValidation } from '@/lib/api/validate';
import { db } from '@/lib/db/connection';
import { AccountingDomainError } from '@/modules/accounting/accounting.error';
import { AccountingCutoverService } from '@/modules/accounting/accounting-cutover.service';
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

      await db.connect();
      const result = await new AccountingCutoverService(
        tenantContext
      ).initialize(validatedBody);

      return apiSuccess(result, undefined, 201);
    } catch (error) {
      if (error instanceof AccountingDomainError) {
        return apiError(error.code, error.message, 422);
      }

      console.error(
        '[POST /api/v1/dashboard/accounting/cutover]',
        error
      );
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
