import { getTenantContext } from '@/lib/api/tenant-context';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { withValidation } from '@/lib/api/validate';
import { db } from '@/lib/db/connection';
import { ManualJournalService } from '@/modules/accounting/manual-journal.service';
import { PostManualJournalSchema } from '@/modules/accounting/manual-journal.schema';

export const POST = withValidation(
  PostManualJournalSchema,
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
      const result = await new ManualJournalService(
        tenantContext
      ).post(validatedBody);

      return apiSuccess(result, undefined, 201);
    } catch (error) {
      console.error(
        '[POST /api/v1/dashboard/accounting/journal-entries/manual]',
        error
      );
      return apiError(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error
          ? error.message
          : 'Gagal memposting manual journal.',
        500
      );
    }
  }
);
