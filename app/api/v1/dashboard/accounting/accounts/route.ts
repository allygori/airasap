import { getTenantContext } from '@/lib/api/tenant-context';
import { withValidation } from '@/lib/api/validate';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import { AccountingExplorerService } from '@/modules/accounting/explorer/accounting-explorer.service';
import { AccountingExplorerQuerySchema } from '@/modules/accounting/explorer/accounting-explorer.schema';

export const GET = withValidation(
  { query: AccountingExplorerQuerySchema },
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
      const explorer = await new AccountingExplorerService(
        tenantContext
      ).getExplorer(validatedQuery!);

      return apiSuccess({
        period: explorer.period,
        accounts: explorer.accounts,
        filters: explorer.filters,
      });
    } catch (error) {
      console.error(
        '[GET /api/v1/dashboard/accounting/accounts]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error
          ? error.message
          : 'Gagal memuat Chart of Accounts.',
        500
      );
    }
  }
);
