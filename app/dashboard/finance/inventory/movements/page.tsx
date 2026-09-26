import Link from 'next/link';
import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';
import {
  assertFinanceModuleActive,
  FinanceDomainError,
  FinanceInventoryMovementListQuerySchema,
  FinanceInventoryMovementReadService,
  type FinanceInventoryMovementListQueryDTO,
  type FinanceInventoryMovementListResponseDTO,
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
import { FinanceInventoryMovementsView } from './_components/finance-inventory-movements-view';

type InventoryMovementsPageProps = {
  searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
};

type PageData =
  | {
      status: 'ready';
      data: FinanceInventoryMovementListResponseDTO;
      query: FinanceInventoryMovementListQueryDTO;
    }
  | { status: 'unavailable' | 'not_ready' };

export default async function InventoryMovementsPage({
  searchParams,
}: InventoryMovementsPageProps) {
  const context = await getTenantContext();
  if (!context.organizationId) return <UnavailableState />;

  const params = searchParams ? await searchParams : {};
  const queryResult =
    FinanceInventoryMovementListQuerySchema.safeParse({
      page: getParam(params.page),
      limit: getParam(params.limit) ?? '25',
      search: getParam(params.search),
      movement_type: getParam(params.movement_type),
      status: getParam(params.status),
    });
  const data = await loadPageData(context, queryResult);

  if (data.status !== 'ready') {
    return data.status === 'unavailable' ? (
      <UnavailableState />
    ) : (
      <NotReadyState />
    );
  }

  return (
    <FinanceInventoryMovementsView
      data={data.data}
      query={data.query}
    />
  );
}

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

async function loadPageData(
  context: FinanceTenantContext,
  queryResult: ReturnType<
    typeof FinanceInventoryMovementListQuerySchema.safeParse
  >
): Promise<PageData> {
  try {
    await db.connect();
    await assertFinanceModuleActive(context);

    const query = queryResult.success
      ? queryResult.data
      : FinanceInventoryMovementListQuerySchema.parse({});
    const data =
      await new FinanceInventoryMovementReadService(
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
            Riwayat mutasi tidak tersedia
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
            Riwayat mutasi tersedia setelah onboarding
            Finance selesai.
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
