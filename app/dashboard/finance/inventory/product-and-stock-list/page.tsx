import Link from 'next/link';
import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';
import {
  assertFinanceModuleActive,
  FinanceDomainError,
  FinanceInventoryStockQuerySchema,
  FinanceInventoryStockReadService,
  type FinanceInventoryStockQueryDTO,
  type FinanceInventoryStockResponseDTO,
  type FinanceTenantContext,
} from '@/modules/finance';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FinanceStockView } from './_components/finance-stock-view';

type FinanceStockPageProps = {
  searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
};

type PageData =
  | {
      status: 'ready';
      data: FinanceInventoryStockResponseDTO;
      query: FinanceInventoryStockQueryDTO;
    }
  | { status: 'unavailable' | 'not_ready' };

export default async function FinanceStockPage({
  searchParams,
}: FinanceStockPageProps) {
  const tenantContext = await getTenantContext();
  if (!tenantContext.organizationId)
    return <UnavailableState />;

  const params = searchParams ? await searchParams : {};
  const queryResult =
    FinanceInventoryStockQuerySchema.safeParse({
      page: getParam(params.page),
      limit: getParam(params.limit) ?? '25',
      search: getParam(params.search),
      item_type: getParam(params.item_type),
      location_id: getParam(params.location_id),
    });
  const data = await loadPageData(
    tenantContext,
    queryResult
  );

  if (data.status !== 'ready') {
    return data.status === 'unavailable' ? (
      <UnavailableState />
    ) : (
      <NotReadyState />
    );
  }

  return (
    <FinanceStockView data={data.data} query={data.query} />
  );
}

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

async function loadPageData(
  context: FinanceTenantContext,
  queryResult: ReturnType<
    typeof FinanceInventoryStockQuerySchema.safeParse
  >
): Promise<PageData> {
  try {
    await db.connect();
    await assertFinanceModuleActive(context);

    const query = queryResult.success
      ? queryResult.data
      : FinanceInventoryStockQuerySchema.parse({});
    const data = await new FinanceInventoryStockReadService(
      context
    ).list(query);
    return { status: 'ready', data, query };
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
            Stock Finance tidak tersedia
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
            Stock Finance tersedia setelah Finance aktif.
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
