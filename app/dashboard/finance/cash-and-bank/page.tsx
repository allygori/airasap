import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';
import {
  assertFinanceModuleActive,
  FinanceCashBankAccountManagementService,
  FinanceCashBankQuerySchema,
  FinanceCashBankReadService,
  FinanceDomainError,
  type FinanceCashBankQueryDTO,
  type FinanceCashBankResponseDTO,
  type FinanceCashBankManagedAccountsResponseDTO,
  type FinanceTenantContext,
} from '@/modules/finance';
import { FinanceNotReadyState } from '../_components/finance-not-ready-state';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FinanceCashAndBank } from './_components/finance-cash-and-bank';

type CashAndBankPageProps = {
  searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
};

type PageData =
  | {
      status: 'ready';
      data: FinanceCashBankResponseDTO;
      managedAccounts: FinanceCashBankManagedAccountsResponseDTO;
      query: FinanceCashBankQueryDTO;
    }
  | { status: 'unavailable' | 'not_ready' };

export default async function CashAndBankPage({
  searchParams,
}: CashAndBankPageProps) {
  const tenantContext = await getTenantContext();

  if (!tenantContext.organizationId) {
    return <UnavailableState />;
  }

  const params = searchParams ? await searchParams : {};
  const queryResult = FinanceCashBankQuerySchema.safeParse({
    search: getParam(params.search),
    status: getParam(params.status),
    limit: getParam(params.limit) ?? '100',
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
        title="Pantau saldo Kas & Bank"
        description="Selesaikan setup Finance untuk melihat saldo rekening dan pergerakan kas usaha dalam satu tempat."
      />
    );
  }

  return (
    <FinanceCashAndBank
      data={data.data}
      managedAccounts={data.managedAccounts}
      query={data.query}
    />
  );
}

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

async function loadPageData(
  context: FinanceTenantContext,
  queryResult: ReturnType<
    typeof FinanceCashBankQuerySchema.safeParse
  >
): Promise<PageData> {
  try {
    await db.connect();
    await assertFinanceModuleActive(context);

    const query = queryResult.success
      ? queryResult.data
      : FinanceCashBankQuerySchema.parse({});
    const [data, managedAccounts] = await Promise.all([
      new FinanceCashBankReadService(context).list(query),
      new FinanceCashBankAccountManagementService(
        context
      ).listAccounts(),
    ]);

    return {
      status: 'ready',
      data,
      managedAccounts,
      query,
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
          <CardTitle>Cash & Bank tidak tersedia</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Organisasi aktif belum tersedia untuk membuka
          Finance.
        </CardContent>
      </Card>
    </div>
  );
}
