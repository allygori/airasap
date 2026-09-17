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
import { assertAccountingModuleActive } from '@/modules/accounting/accounting-module.guard';
import { AccountingDomainError } from '@/modules/accounting/accounting.error';

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
      await assertAccountingModuleActive(tenantContext);
      const explorer = await new AccountingExplorerService(
        tenantContext
      ).getExplorer(validatedQuery!);

      return apiSuccess({
        period: explorer.period,
        journal_entries: explorer.journal_entries,
        filters: explorer.filters,
      });
    } catch (error) {
      if (error instanceof AccountingDomainError) {
        return apiError(error.code, error.message, 422);
      }
      console.error(
        '[GET /api/v1/dashboard/accounting/journal-entries]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error
          ? error.message
          : 'Gagal memuat journal entries.',
        500
      );
    }
  }
);
