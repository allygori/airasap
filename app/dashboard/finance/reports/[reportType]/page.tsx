import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { db } from '@/lib/db/connection';
import { getTenantContext } from '@/lib/api/tenant-context';
import {
  assertFinanceModuleActive,
  FinanceDomainError,
  FinanceFinancialStatementsReadService,
  FinanceStatementQuerySchema,
  type FinanceFinancialStatementReport,
  type FinanceTenantContext,
} from '@/modules/finance';
import { FinanceFinancialStatementClient } from '../_components/finance-financial-statement.client';

type ReportPageProps = {
  params: Promise<{ reportType: string }>;
  searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
};

type FinancialReportMethod =
  | 'trialBalance'
  | 'profitAndLoss'
  | 'balanceSheet'
  | 'cashFlow';

const reportMethods: Record<string, FinancialReportMethod> =
  {
    'trial-balance': 'trialBalance',
    'profit-and-loss': 'profitAndLoss',
    'balance-sheet': 'balanceSheet',
    'cash-flow': 'cashFlow',
  };

type PageData =
  | {
      status: 'ready';
      report: FinanceFinancialStatementReport;
    }
  | { status: 'unavailable' | 'not_ready' };

export default async function FinanceReportPage({
  params,
  searchParams,
}: ReportPageProps) {
  const { reportType } = await params;
  const paramsRecord: Record<
    string,
    string | string[] | undefined
  > = searchParams ? await searchParams : {};

  const tenantContext = await getTenantContext();
  if (!tenantContext.organizationId) {
    return <UnavailableState />;
  }

  const method = reportMethods[reportType];
  if (!method) notFound();

  const data = await loadReport(
    tenantContext,
    method,
    FinanceStatementQuerySchema.safeParse({
      period: getParam(paramsRecord.period),
    })
  );

  if (data.status !== 'ready') {
    return data.status === 'unavailable' ? (
      <UnavailableState />
    ) : (
      <NotReadyState />
    );
  }

  return (
    <FinanceFinancialStatementClient report={data.report} />
  );
}

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

async function loadReport(
  context: FinanceTenantContext,
  method: FinancialReportMethod,
  queryResult: ReturnType<
    typeof FinanceStatementQuerySchema.safeParse
  >
): Promise<PageData> {
  try {
    await db.connect();
    await assertFinanceModuleActive(context);
    const query = queryResult.success
      ? queryResult.data
      : FinanceStatementQuerySchema.parse({});
    const service =
      new FinanceFinancialStatementsReadService(context);
    const report = await service[method](query);
    return { status: 'ready', report };
  } catch (error: unknown) {
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
    <main className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>
            Laporan Finance tidak tersedia
          </CardTitle>
          <CardDescription>
            Organisasi aktif belum tersedia untuk membuka
            Finance.
          </CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}

function NotReadyState() {
  return (
    <main className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Finance belum aktif</CardTitle>
          <CardDescription>
            Laporan tersedia setelah onboarding Finance
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
    </main>
  );
}
