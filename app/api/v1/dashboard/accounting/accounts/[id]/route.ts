import { z } from 'zod';

import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { getTenantContext } from '@/lib/api/tenant-context';
import { withValidation } from '@/lib/api/validate';
import { db } from '@/lib/db/connection';
import { AccountingDomainError } from '@/modules/accounting/accounting.error';
import { AccountingAccountService } from '@/modules/accounting/accounts/account.service';
import { UpdateAccountDetailsSchema } from '@/modules/accounting/accounts/account.schema';

const ParamsSchema = z.object({
  id: z.string().min(1),
});

const handleError = (error: unknown) => {
  if (error instanceof AccountingDomainError) {
    const status =
      error.code === 'ACCOUNT_NOT_FOUND'
        ? 404
        : error.code === 'SYSTEM_ACCOUNT_READ_ONLY'
          ? 403
          : 422;

    return apiError(error.code, error.message, status);
  }

  console.error(
    '[PATCH /api/v1/dashboard/accounting/accounts/[id]]',
    error
  );
  return apiError(
    ErrorCodes.INTERNAL_ERROR,
    error instanceof Error
      ? error.message
      : 'Gagal mengubah account.',
    500
  );
};

export const PATCH = withValidation(
  {
    body: UpdateAccountDetailsSchema,
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
        typeof UpdateAccountDetailsSchema
      >;
      const account = await new AccountingAccountService(
        tenantContext
      ).updateDetails(params.id, {
        name: body.name,
        description: body.description || null,
      });

      return apiSuccess({ account });
    } catch (error) {
      return handleError(error);
    }
  }
);
