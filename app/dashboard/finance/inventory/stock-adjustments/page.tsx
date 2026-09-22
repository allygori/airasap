import Link from 'next/link';
import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';
import {
  assertFinanceModuleActive,
  FinanceDomainError,
  type FinanceInventoryAdjustmentItemOptionDTO,
  type FinanceInventoryAdjustmentLocationOptionDTO,
  type FinanceTenantContext,
} from '@/modules/finance';
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
import { FinanceStockAdjustmentForm } from './_components/finance-stock-adjustment-form';

type StockAdjustmentPageProps = {
  searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
};

type PageData =
  | {
      status: 'ready';
      items: FinanceInventoryAdjustmentItemOptionDTO[];
      locations: FinanceInventoryAdjustmentLocationOptionDTO[];
    }
  | { status: 'unavailable' | 'not_ready' };

export default async function StockAdjustmentsPage({
  searchParams,
}: StockAdjustmentPageProps) {
  void searchParams;
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
    <FinanceStockAdjustmentForm
      items={data.items}
      locations={data.locations}
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
    const [{ records }] = await Promise.all([
      itemRepository.listActive({
        page: 1,
        limit: 200,
      }),
    ]);
    const locations = await locationRepository.listActive();

    return {
      status: 'ready',
      items: records.map((item) => ({
        id: String(item._id),
        sku: item.sku,
        name: item.name,
        unit: item.unit,
        track_value: item.track_value,
      })),
      locations: locations.map((location) => ({
        id: String(location._id),
        code: location.code,
        name: location.name,
      })),
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
            Stock adjustment tidak tersedia
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
            Stock adjustment tersedia setelah Finance aktif.
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
