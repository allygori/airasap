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
  FinanceCashLoanService,
  FinanceOwnerWithdrawalService,
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

      const cashLoanService = new FinanceCashLoanService(
        tenantContext
      );
      const salesTransactionRepository =
        new FinanceSalesTransactionRepository(
          tenantContext
        );
      const retryCogsTransaction =
        await salesTransactionRepository.findByCogsRetryJournalEntryId(
          validatedParams!.journalId
        );
      if (retryCogsTransaction) {
        throw new FinanceDomainError(
          'Jurnal HPP retry harus direverse melalui jurnal penjualan terkait.',
          'FINANCE_SALES_COGS_RETRY_JOURNAL_REQUIRES_SALE_REVERSAL'
        );
      }

      const salesTransaction =
        await salesTransactionRepository.findByJournalEntryId(
          validatedParams!.journalId
        );
      if (salesTransaction?.inventory_cogs_retry_plan) {
        throw new FinanceDomainError(
          'Retry HPP sedang dalam proses. Selesaikan atau ulangi retry HPP sebelum mereverse jurnal penjualan.',
          'FINANCE_SALES_COGS_RETRY_IN_PROGRESS'
        );
      }

      await cashLoanService.assertCanReverseJournal(
        validatedParams!.journalId
      );

      const journalService = new FinanceJournalService(
        tenantContext
      );
      const inventoryCogsService =
        new FinanceInventoryCogsService(tenantContext);
      const effectiveDate =
        validatedBody!.effective_date ?? new Date();
      const reversalResult = await journalService.reverse(
        validatedParams!.journalId,
        validatedBody!
      );

      await inventoryCogsService.reversePostedSalesMovements(
        validatedParams!.journalId,
        reversalResult.journal_entry.id,
        effectiveDate
      );

      if (
        salesTransaction?.inventory_cogs_journal_entry_id
      ) {
        const cogsReversal = await journalService.reverse(
          String(
            salesTransaction.inventory_cogs_journal_entry_id
          ),
          {
            effective_date: effectiveDate,
            description: `Reversal jurnal HPP penjualan ${salesTransaction.source_order_number}`,
          }
        );
        await inventoryCogsService.reversePostedSalesMovements(
          String(
            salesTransaction.inventory_cogs_journal_entry_id
          ),
          cogsReversal.journal_entry.id,
          effectiveDate
        );
      }

      await salesTransactionRepository.markReversedByJournalEntry(
        validatedParams!.journalId
      );

      await new FinanceCashBankTransferRepository(
        tenantContext
      ).markReversedByJournalEntry(
        validatedParams!.journalId,
        reversalResult.journal_entry.id
      );

      await new FinanceOwnerWithdrawalService(
        tenantContext
      ).synchronizeJournalReversal(
        validatedParams!.journalId,
        reversalResult.journal_entry.id
      );

      await cashLoanService.synchronizeJournalReversal(
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
                    'FINANCE_INVENTORY_COGS_REVERSAL_FAILED' ||
                  error.code ===
                    'FINANCE_SALES_COGS_RETRY_JOURNAL_REQUIRES_SALE_REVERSAL' ||
                  error.code ===
                    'FINANCE_SALES_COGS_RETRY_IN_PROGRESS' ||
                  error.code ===
                    'FINANCE_OWNER_WITHDRAWAL_REVERSAL_FINALIZATION_FAILED' ||
                  error.code ===
                    'FINANCE_CASH_LOAN_NOT_REVERSIBLE' ||
                  error.code ===
                    'FINANCE_CASH_LOAN_REVERSAL_FINALIZATION_FAILED'
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
