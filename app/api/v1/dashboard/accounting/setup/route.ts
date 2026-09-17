import { z } from 'zod';
import { getTenantContext } from '@/lib/api/tenant-context';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import { AccountingAccountService } from '@/modules/accounting/accounts/account.service';
import { AccountingPeriodRepository } from '@/modules/accounting/periods/accounting-period.repository';
import { AccountingPeriodService } from '@/modules/accounting/periods/accounting-period.service';
import { InventoryLocationRepository } from '@/modules/inventory/locations/inventory-location.repository';
import { AccountingLifecycleService } from '@/modules/accounting/accounting-lifecycle.service';
import { TIMEZONE_VALUES } from '@/constant/timezone';
import {
  getAccountingPeriodDateRange,
  getPeriodKeyFromDate,
  parseAccountingCalendarDate,
} from '@/modules/accounting/accounting.types';

const SetupSchema = z.object({
  cutover_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  calendar_timezone: z.enum(TIMEZONE_VALUES).optional(),
});

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    let body: unknown = {};
    if (rawBody.trim()) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        return apiError(
          ErrorCodes.VALIDATION_ERROR,
          'Format JSON tidak valid.',
          400
        );
      }
    }
    const parsedBody = SetupSchema.safeParse(body);
    if (!parsedBody.success) {
      return apiError(
        ErrorCodes.VALIDATION_ERROR,
        'Validasi input setup accounting gagal.',
        400,
        parsedBody.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }))
      );
    }

    const tenantContext = await getTenantContext();
    if (!tenantContext.organizationId) {
      return apiError(
        ErrorCodes.FORBIDDEN,
        'Organization ID tidak ditemukan.',
        403
      );
    }

    await db.connect();
    const now = new Date();
    const accountingState =
      await new AccountingLifecycleService(
        tenantContext
      ).getState();
    const timezone =
      parsedBody.data.calendar_timezone ??
      accountingState.calendar_timezone ??
      'Asia/Jakarta';
    let periodDate = now;
    if (parsedBody.data.cutover_date) {
      try {
        periodDate = parseAccountingCalendarDate(
          parsedBody.data.cutover_date,
          timezone,
          'cutover_date'
        );
      } catch (error) {
        return apiError(
          ErrorCodes.VALIDATION_ERROR,
          error instanceof Error
            ? error.message
            : 'Cutover date tidak valid.',
          400
        );
      }
    }
    const periodKey = getPeriodKeyFromDate(
      periodDate,
      timezone
    );
    const periodRepository = new AccountingPeriodRepository(
      tenantContext
    );
    const locationRepository =
      new InventoryLocationRepository(tenantContext);

    const [coa, existingPeriod, defaultLocation] =
      await Promise.all([
        new AccountingAccountService(
          tenantContext
        ).seedDefaultAccounts(),
        periodRepository.findByPeriodKey(periodKey),
        locationRepository.ensureDefaultLocation(),
      ]);

    const { start_date: startDate, end_date: endDate } =
      getAccountingPeriodDateRange(periodKey, timezone);

    const period = existingPeriod
      ? existingPeriod
      : await new AccountingPeriodService(
          tenantContext
        ).create(
          {
            period_key: periodKey,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            status: 'open',
          },
          timezone
        );

    return apiSuccess({
      coa,
      period,
      defaultLocation,
      message: existingPeriod
        ? 'Accounting workspace siap digunakan.'
        : 'Accounting workspace dan lokasi inventory default berhasil disiapkan.',
    });
  } catch (error) {
    console.error(
      '[POST /api/v1/dashboard/accounting/setup]',
      error
    );
    return apiError(
      ErrorCodes.INTERNAL_ERROR,
      error instanceof Error
        ? error.message
        : 'Gagal menyiapkan accounting workspace.',
      500
    );
  }
}
