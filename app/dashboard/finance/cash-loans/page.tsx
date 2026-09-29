import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';
import {
  assertFinanceModuleActive,
  FinanceDomainError,
  FinanceCashLoanListQuerySchema,
  FinanceCashLoanReadService,
  getFinanceCalendarDate,
  type FinanceCashLoanListResponseDTO,
  type FinanceTenantContext,
} from '@/modules/finance';
import { FinanceAccountRepository } from '@/modules/finance/accounts/finance-account.repository';
import { FinanceNotReadyState } from '../_components/finance-not-ready-state';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FinanceCashLoanClient } from './_components/cash-loan.client';

type AccountOption = {
  id: string;
  code: string;
  name: string;
  subtype?: string | null;
};
type PageData =
  | {
      status: 'ready';
      ownerAccounts: AccountOption[];
      paymentAccounts: AccountOption[];
      loans: FinanceCashLoanListResponseDTO;
      businessDate: string;
    }
  | { status: 'unavailable' | 'not_ready' };

type CashLoansPageProps = {
  searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
};

export default async function CashLoansPage({
  searchParams,
}: CashLoansPageProps) {
  const context = await getTenantContext();
  if (!context.organizationId) return <UnavailableState />;

  const params = (await searchParams) ?? {};
  const data = await loadPageData(context, params);
  if (data.status !== 'ready') {
    return data.status === 'unavailable' ? (
      <UnavailableState />
    ) : (
      <FinanceNotReadyState
        title="Catat pinjaman tunai"
        description="Setelah Finance aktif, catat dana pinjaman yang diterima usaha dan pembayaran pokoknya tanpa mencampurnya dengan modal atau pendapatan."
      />
    );
  }

  return (
    <FinanceCashLoanClient
      ownerAccounts={data.ownerAccounts}
      paymentAccounts={data.paymentAccounts}
      loans={data.loans}
      businessDate={data.businessDate}
    />
  );
}

async function loadPageData(
  context: FinanceTenantContext,
  params: Record<string, string | string[] | undefined>
): Promise<PageData> {
  try {
    await db.connect();
    const finance =
      await assertFinanceModuleActive(context);
    const accounts = new FinanceAccountRepository(context);
    const [equityAccounts, paymentAccounts] =
      await Promise.all([
        accounts.list({
          type: 'equity',
          is_postable: true,
          limit: 500,
        }),
        accounts.listPostableBySubtypes(['cash', 'bank'], {
          limit: 100,
        }),
      ]);
    const ownerAccounts = equityAccounts
      .filter(
        (account) =>
          account.subtype === 'owner_capital' &&
          account.is_active
      )
      .map((account) => ({
        id: String(account._id),
        code: account.code,
        name: account.name,
      }));
    const businessDate = getFinanceCalendarDate(
      new Date(),
      finance.calendar_timezone
    );
    const rawPage = Array.isArray(params.page)
      ? params.page[0]
      : params.page;
    const parsedQuery =
      FinanceCashLoanListQuerySchema.safeParse({
        page: rawPage,
        limit: 25,
      });
    const query = parsedQuery.success
      ? parsedQuery.data
      : FinanceCashLoanListQuerySchema.parse({
          page: 1,
          limit: 25,
        });
    const loans = await new FinanceCashLoanReadService(
      context
    ).list(query);

    return {
      status: 'ready',
      ownerAccounts,
      paymentAccounts: paymentAccounts.map((account) => ({
        id: String(account._id),
        code: account.code,
        name: account.name,
        subtype: account.subtype ?? null,
      })),
      loans,
      businessDate,
    };
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
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>
            Pinjaman Tunai tidak tersedia
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
