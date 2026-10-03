import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';
import {
  assertFinanceModuleActive,
  FINANCE_CASH_BANK_SUBTYPE_VALUES,
  FinanceDomainError,
  FinancePurchaseListQuerySchema,
  FinancePurchaseReadService,
  FinanceSupplierService,
  type FinancePurchaseListResponseDTO,
  type FinanceTenantContext,
} from '@/modules/finance';
import { FinanceAccountRepository } from '@/modules/finance/accounts/finance-account.repository';
import { FinanceInventoryItemRepository } from '@/modules/finance/inventory/finance-inventory-item.repository';
import { FinanceInventoryLocationRepository } from '@/modules/finance/inventory/finance-inventory-location.repository';
import { FinanceNotReadyState } from '../_components/finance-not-ready-state';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FinancePurchaseClient } from './_components/purchase.client';

type PurchaseItemOption = {
  id: string;
  sku: string;
  name: string;
  unit: string;
};

type PurchaseLocationOption = {
  id: string;
  code: string;
  name: string;
};

type PurchaseAccountOption = {
  id: string;
  code: string;
  name: string;
  subtype: string | null;
};

type PageData =
  | {
      status: 'ready';
      items: PurchaseItemOption[];
      locations: PurchaseLocationOption[];
      paymentAccounts: PurchaseAccountOption[];
      suppliers: { id: string; name: string }[];
      purchases: FinancePurchaseListResponseDTO;
    }
  | { status: 'unavailable' | 'not_ready' };

export default async function FinancePurchasePage() {
  const tenantContext = await getTenantContext();
  if (!tenantContext.organizationId) {
    return <UnavailableState />;
  }

  const data = await loadPageData(tenantContext);
  if (data.status !== 'ready') {
    return data.status === 'unavailable' ? (
      <UnavailableState />
    ) : (
      <FinanceNotReadyState
        title="Catat pembelian barang"
        description="Aktifkan Finance melalui onboarding untuk mencatat pembelian, memperbarui stok, dan membuat jurnal terkait."
        actionLabel="Lanjutkan onboarding"
      />
    );
  }

  return (
    <FinancePurchaseClient
      items={data.items}
      locations={data.locations}
      paymentAccounts={data.paymentAccounts}
      suppliers={data.suppliers}
      purchases={data.purchases}
    />
  );
}

async function loadPageData(
  context: FinanceTenantContext
): Promise<PageData> {
  try {
    await db.connect();
    await assertFinanceModuleActive(context);

    const itemRepository =
      new FinanceInventoryItemRepository(context);
    const locationRepository =
      new FinanceInventoryLocationRepository(context);
    const accountRepository = new FinanceAccountRepository(
      context
    );

    const [
      { records: items },
      locations,
      paymentAccounts,
      suppliers,
      purchases,
    ] = await Promise.all([
      itemRepository.listActive({ page: 1, limit: 200 }),
      locationRepository.listActive(),
      accountRepository.listPostableBySubtypes(
        [...FINANCE_CASH_BANK_SUBTYPE_VALUES],
        { limit: 100 }
      ),
      new FinanceSupplierService(context).list({
        page: 1,
        limit: 100,
        status: 'active',
      }),
      new FinancePurchaseReadService(context).list(
        FinancePurchaseListQuerySchema.parse({})
      ),
    ]);

    return {
      status: 'ready',
      items: items.map((item) => ({
        id: String(item._id),
        sku: item.sku,
        name: item.name,
        unit: item.unit,
      })),
      locations: locations.map((location) => ({
        id: String(location._id),
        code: location.code,
        name: location.name,
      })),
      paymentAccounts: paymentAccounts.map((account) => ({
        id: String(account._id),
        code: account.code,
        name: account.name,
        subtype: account.subtype ?? null,
      })),
      suppliers: suppliers.suppliers.map((supplier) => ({
        id: supplier.supplier_id,
        name: supplier.name,
      })),
      purchases,
    };
  } catch (error) {
    if (
      error instanceof FinanceDomainError &&
      error.code === 'FINANCE_ORGANIZATION_NOT_FOUND'
    ) {
      return { status: 'unavailable' };
    }
    if (
      error instanceof FinanceDomainError &&
      error.code === 'FINANCE_NOT_ACTIVE'
    ) {
      return { status: 'not_ready' };
    }
    throw error;
  }
}

function UnavailableState() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>
            Purchase Finance tidak tersedia
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Organisasi aktif belum tersedia untuk membuka
          Finance.
        </CardContent>
      </Card>
    </div>
  );
}
