import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';
import {
  assertFinanceModuleActive,
  FinanceDomainError,
  FinanceSalesTransactionListQuerySchema,
  FinanceSalesTransactionReadService,
  type FinanceSalesTransactionListQueryDTO,
  type FinanceSalesTransactionListResponseDTO,
  type FinanceTenantContext,
} from '@/modules/finance';
import { FinanceNotReadyState } from '../_components/finance-not-ready-state';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FinanceSalesTransactions } from './_components/finance-sales-transactions';

type FinanceSalesPageProps = {
  searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
};

type PageData =
  | {
      status: 'ready';
      data: FinanceSalesTransactionListResponseDTO;
      query: FinanceSalesTransactionListQueryDTO;
    }
  | { status: 'unavailable' | 'not_ready' };

export default async function FinanceSalesPage({
  searchParams,
}: FinanceSalesPageProps) {
  const tenantContext = await getTenantContext();

  if (!tenantContext.organizationId) {
    return <UnavailableState />;
  }

  const params = searchParams ? await searchParams : {};
  const queryResult =
    FinanceSalesTransactionListQuerySchema.safeParse({
      page: getParam(params.page),
      limit: getParam(params.limit) ?? '25',
      status: getParam(params.status),
      posting_mode: getParam(params.posting_mode),
      search: getParam(params.search),
    });
  const data = await loadPageData(
    tenantContext,
    queryResult
  );

  if (data.status !== 'ready') {
    return data.status === 'unavailable' ? (
      <UnavailableState />
    ) : (
      <FinanceNotReadyState
        title="Tinjau penjualan Finance"
        description="Aktifkan Finance untuk melihat status pencatatan penjualan dan jurnal yang terkait dengan order."
      />
    );
  }

  return (
    <FinanceSalesTransactions
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
    typeof FinanceSalesTransactionListQuerySchema.safeParse
  >
): Promise<PageData> {
  try {
    await db.connect();
    await assertFinanceModuleActive(context);

    const query = queryResult.success
      ? queryResult.data
      : FinanceSalesTransactionListQuerySchema.parse({});
    const data =
      await new FinanceSalesTransactionReadService(
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
            Penjualan Finance tidak tersedia
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
