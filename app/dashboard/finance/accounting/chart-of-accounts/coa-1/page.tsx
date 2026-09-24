import Link from 'next/link';
import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';
import {
  assertFinanceModuleActive,
  FinanceAccountService,
  FinanceAccountFilterSchema,
  FinanceDomainError,
  type FinanceAccountFilterDTO,
  type FinanceAccountListResponseDTO,
  type FinanceTenantContext,
} from '@/modules/finance';
import { FinanceChartOfAccounts } from '../_components/finance-chart-of-accounts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';

type ChartOfAccountsPageProps = {
  searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
};

type PageData =
  | {
      status: 'ready';
      data: FinanceAccountListResponseDTO;
      filter: FinanceAccountFilterDTO;
    }
  | { status: 'unavailable' }
  | { status: 'not_ready' };

export default async function ChartOfAccountsPage({
  searchParams,
}: ChartOfAccountsPageProps) {
  const tenantContext = await getTenantContext();

  if (!tenantContext.organizationId) {
    return <UnavailableState />;
  }

  const params = searchParams ? await searchParams : {};
  const data = await loadPageData(
    tenantContext,
    FinanceAccountFilterSchema.safeParse({
      type: getParam(params.type),
      search: getParam(params.search),
      limit: '500',
    })
  );

  if (data.status === 'unavailable') {
    return <UnavailableState />;
  }

  if (data.status === 'not_ready') {
    return <NotReadyState />;
  }

  return (
    <FinanceChartOfAccounts
      data={data.data}
      filters={data.filter}
    />
  );
}

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

async function loadPageData(
  context: FinanceTenantContext,
  filterResult: ReturnType<
    typeof FinanceAccountFilterSchema.safeParse
  >
): Promise<PageData> {
  try {
    await db.connect();
    await assertFinanceModuleActive(context);

    const filter = filterResult.success
      ? filterResult.data
      : FinanceAccountFilterSchema.parse({ limit: '500' });

    const data = await new FinanceAccountService(
      context
    ).list(filter);

    return { status: 'ready', data, filter };
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
            Chart of Accounts tidak tersedia
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
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Selesaikan onboarding Finance sebelum mengelola
          Chart of Accounts.
          <Link
            href="/dashboard/finance/onboarding"
            className={buttonVariants({
              variant: 'outline',
              className: 'mt-4',
            })}
          >
            Buka onboarding
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
