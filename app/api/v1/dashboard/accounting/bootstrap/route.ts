import { getTenantContext } from '@/lib/api/tenant-context';
import {
  apiError,
  apiSuccess,
  ErrorCodes,
} from '@/lib/api/response';
import { db } from '@/lib/db/connection';
import { AccountingAccountService } from '@/modules/accounting/accounts/account.service';
import { AccountingPeriodRepository } from '@/modules/accounting/periods/accounting-period.repository';
import { InventoryItemRepository } from '@/modules/inventory/items/inventory-item.repository';
import { InventoryLocationRepository } from '@/modules/inventory/locations/inventory-location.repository';
import { getAccountingScopeOptions } from '@/modules/accounting/accounting-scope';
import { toAccountingObjectId } from '@/modules/accounting/accounting.types';

export async function GET() {
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

    const [
      accounts,
      inventoryItems,
      locations,
      openPeriod,
      scopeOptions,
    ] = await Promise.all([
      new AccountingAccountService(
        tenantContext
      ).listActive(),
      new InventoryItemRepository(tenantContext).findAll({
        is_active: true,
      }),
      new InventoryLocationRepository(
        tenantContext
      ).findAll({
        is_active: true,
      }),
      new AccountingPeriodRepository(
        tenantContext
      ).findOpenContainingDate(periodKey, now),
      getAccountingScopeOptions(
        toAccountingObjectId(
          tenantContext.organizationId,
          'organizationId'
        )
      ),
    ]);

    return apiSuccess({
      accounts,
      inventoryItems,
      locations,
      openPeriod,
      scopeOptions,
      currentPeriodKey: periodKey,
    });
  } catch (error) {
    console.error(
      '[GET /api/v1/dashboard/accounting/bootstrap]',
      error
    );
    return apiError(
      ErrorCodes.INTERNAL_ERROR,
      error instanceof Error
        ? error.message
        : 'Gagal memuat accounting workspace.',
      500
    );
  }
}
