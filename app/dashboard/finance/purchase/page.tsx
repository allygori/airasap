import Link from 'next/link';
import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';
import {
  assertFinanceModuleActive,
  FINANCE_CASH_BANK_SUBTYPE_VALUES,
  FinanceDomainError,
  FinancePurchaseListQuerySchema,
  FinancePurchaseReadService,
  type FinancePurchaseListResponseDTO,
  type FinanceTenantContext,
} from '@/modules/finance';
import { FinanceAccountRepository } from '@/modules/finance/accounts/finance-account.repository';
import { FinanceInventoryItemRepository } from '@/modules/finance/inventory/finance-inventory-item.repository';
import { FinanceInventoryLocationRepository } from '@/modules/finance/inventory/finance-inventory-location.repository';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FinancePurchaseForm } from './_components/finance-purchase-form';

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
      <NotReadyState />
    );
  }

  return (
    <FinancePurchaseForm
      items={data.items}
      locations={data.locations}
      paymentAccounts={data.paymentAccounts}
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
      purchases,
    ] = await Promise.all([
      itemRepository.listActive({ page: 1, limit: 200 }),
      locationRepository.listActive(),
      accountRepository.listPostableBySubtypes(
        [...FINANCE_CASH_BANK_SUBTYPE_VALUES],
        { limit: 100 }
      ),
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

function NotReadyState() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Finance belum aktif</CardTitle>
          <CardDescription>
            Purchase tersedia setelah onboarding Finance
            selesai.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/dashboard/finance/onboarding"
            className={buttonVariants({
              variant: 'outline',
            })}
          >
            Buka onboarding
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
