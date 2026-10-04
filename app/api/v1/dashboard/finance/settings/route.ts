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
  FinanceDomainError,
  FinanceSettingsService,
  UpdateFinanceSettingsSchema,
} from '@/modules/finance';

export async function GET() {
  try {
    const context = await getTenantContext();

    if (!context.organizationId) {
      return apiError(
        ErrorCodes.FORBIDDEN,
        'Organization ID tidak ditemukan.',
        403
      );
    }

    await db.connect();
    await assertFinancePremium(context);
    const settings = await new FinanceSettingsService(
      context
    ).getSettings();

    return apiSuccess(settings);
  } catch (error) {
    return handleFinanceSettingsError(
      error,
      'GET /api/v1/dashboard/finance/settings',
      'Gagal memuat pengaturan Finance.'
    );
  }
}

export const PATCH = withValidation(
  UpdateFinanceSettingsSchema,
  async (_request, { validatedBody }) => {
    if (!validatedBody) {
      return apiError(
        ErrorCodes.VALIDATION_ERROR,
        'Validasi input gagal.',
        400
      );
    }

    try {
      const context = await getTenantContext();

      if (!context.organizationId) {
        return apiError(
          ErrorCodes.FORBIDDEN,
          'Organization ID tidak ditemukan.',
          403
        );
      }

      await db.connect();
      await assertFinancePremium(context);
      const service = new FinanceSettingsService(context);
      if ('calendar_timezone' in validatedBody) {
        await service.setCalendarTimezone(
          validatedBody.calendar_timezone
        );
      } else {
        await service.setShopeePayoutAccount(validatedBody);
      }

      return apiSuccess(await service.getSettings());
    } catch (error) {
      return handleFinanceSettingsError(
        error,
        'PATCH /api/v1/dashboard/finance/settings',
        'Pengaturan Finance gagal disimpan.'
      );
    }
  }
);

function handleFinanceSettingsError(
  error: unknown,
  operation: string,
  fallbackMessage: string
) {
  if (error instanceof FinanceDomainError) {
    const status =
      error.code === 'FINANCE_ORGANIZATION_NOT_FOUND'
        ? 404
        : error.code === 'FINANCE_OWNER_REQUIRED' ||
            error.code === 'FINANCE_NOT_ACTIVE'
          ? 403
          : error.code ===
                'FINANCE_CALENDAR_TIMEZONE_LOCKED' ||
              error.code ===
                'FINANCE_ONBOARDING_NOT_IN_PROGRESS' ||
              error.code ===
                'FINANCE_CALENDAR_TIMEZONE_UPDATE_FAILED' ||
              error.code ===
                'FINANCE_PAYOUT_ACCOUNT_SETTINGS_LOCKED' ||
              error.code ===
                'FINANCE_PAYOUT_ACCOUNT_UPDATE_FAILED'
            ? 409
            : error.code ===
                'FINANCE_PAYOUT_ACCOUNT_INVALID'
              ? 422
              : 400;

    return apiError(error.code, error.message, status);
  }

  console.error(`[${operation}]`, error);
  return apiError(
    ErrorCodes.INTERNAL_ERROR,
    fallbackMessage,
    500
  );
}
