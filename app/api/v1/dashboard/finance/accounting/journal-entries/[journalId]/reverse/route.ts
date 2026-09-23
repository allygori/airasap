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
  FinanceJournalReversalSchema,
  FinanceJournalService,
  FinanceInventoryCogsService,
  FinanceCashBankTransferRepository,
  FinanceSalesTransactionRepository,
} from '@/modules/finance';

const FinanceJournalRouteParamsSchema = z
  .object({ journalId: z.string().trim().min(1) })
  .strict();

export const POST = withValidation(
  {
    body: FinanceJournalReversalSchema,
    params: FinanceJournalRouteParamsSchema,
  },
  async (_request, { validatedBody, validatedParams }) => {
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

      const reversalResult =
        await new FinanceJournalService(
          tenantContext
        ).reverse(
          validatedParams!.journalId,
          validatedBody!
        );

      await new FinanceInventoryCogsService(
        tenantContext
      ).reversePostedSalesMovements(
        validatedParams!.journalId,
        reversalResult.journal_entry.id,
        validatedBody!.effective_date ?? new Date()
      );

      await new FinanceSalesTransactionRepository(
        tenantContext
      ).markReversedByJournalEntry(
        validatedParams!.journalId
      );

      await new FinanceCashBankTransferRepository(
        tenantContext
      ).markReversedByJournalEntry(
        validatedParams!.journalId,
        reversalResult.journal_entry.id
      );

      return apiSuccess(
        reversalResult,
        undefined,
        reversalResult.replayed ? 200 : 201
      );
    } catch (error) {
      if (error instanceof FinanceDomainError) {
        const status =
          error.code === 'FINANCE_ORGANIZATION_NOT_FOUND' ||
          error.code === 'FINANCE_JOURNAL_NOT_FOUND'
            ? 404
            : error.code === 'FINANCE_NOT_ACTIVE'
              ? 403
              : error.code ===
                    'FINANCE_JOURNAL_REVERSAL_CONFLICT' ||
                  error.code ===
                    'FINANCE_JOURNAL_REVERSAL_FINALIZATION_FAILED' ||
                  error.code ===
                    'FINANCE_INVENTORY_COGS_REVERSAL_FAILED'
                ? 409
                : 422;

        return apiError(error.code, error.message, status);
      }

      console.error(
        '[POST /api/v1/dashboard/finance/accounting/journal-entries/:journalId/reverse]',
        error
      );

      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        'Gagal melakukan reversal journal Finance.',
        500
      );
    }
  }
);
