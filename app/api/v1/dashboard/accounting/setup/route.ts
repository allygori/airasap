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

export async function POST() {
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
    const now = new Date();
    const periodKey = `${now.getUTCFullYear()}-${String(
      now.getUTCMonth() + 1
    ).padStart(2, '0')}`;
    const periodRepository = new AccountingPeriodRepository(
      tenantContext
    );

    const [coa, existingPeriod] = await Promise.all([
      new AccountingAccountService(
        tenantContext
      ).seedDefaultAccounts(),
      periodRepository.findByPeriodKey(periodKey),
    ]);

    const startDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    );
    const endDate = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() + 1,
        0,
        23,
        59,
        59,
        999
      )
    );

    const period = existingPeriod
      ? existingPeriod
      : await new AccountingPeriodService(
          tenantContext
        ).create({
          period_key: periodKey,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: 'open',
        });

    return apiSuccess({
      coa,
      period,
      message: existingPeriod
        ? 'Chart of Accounts siap digunakan.'
        : 'Chart of Accounts dan accounting period berhasil disiapkan.',
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
