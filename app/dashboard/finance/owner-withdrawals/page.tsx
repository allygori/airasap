import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';
import {
  assertFinanceModuleActive,
  FinanceDomainError,
  FinanceOwnerWithdrawalListQuerySchema,
  FinanceOwnerWithdrawalReadService,
  getFinanceCalendarDate,
  type FinanceOwnerWithdrawalListResponseDTO,
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
import { FinanceOwnerWithdrawalClient } from './_components/owner-withdrawal.client';

type AccountOption = {
  id: string;
  code: string;
  name: string;
};

type PageData =
  | {
      status: 'ready';
      ownerAccounts: AccountOption[];
      ownerFilterAccounts: AccountOption[];
      paymentAccounts: AccountOption[];
      withdrawals: FinanceOwnerWithdrawalListResponseDTO;
      filters: {
        from_date: string;
        to_date: string;
        owner_account_id: string;
      };
      businessDate: string;
    }
  | { status: 'unavailable' | 'not_ready' };

type OwnerWithdrawalsPageProps = {
  searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
};

export default async function OwnerWithdrawalsPage({
  searchParams,
}: OwnerWithdrawalsPageProps) {
  const tenantContext = await getTenantContext();
  if (!tenantContext.organizationId) {
    return <UnavailableState />;
  }

  const data = await loadPageData(
    tenantContext,
    (await searchParams) ?? {}
  );
  if (data.status !== 'ready') {
    return data.status === 'unavailable' ? (
      <UnavailableState />
    ) : (
      <FinanceNotReadyState
        title="Catat pengambilan pemilik"
        description="Setelah setup Finance, Anda dapat mencatat distribusi laba atau pengambilan pemilik tanpa mencampurnya dengan pengeluaran usaha."
      />
    );
  }

  return (
    <FinanceOwnerWithdrawalClient
      ownerAccounts={data.ownerAccounts}
      ownerFilterAccounts={data.ownerFilterAccounts}
      paymentAccounts={data.paymentAccounts}
      withdrawals={data.withdrawals}
      filters={data.filters}
      businessDate={data.businessDate}
    />
  );
}

async function loadPageData(
  context: FinanceTenantContext,
  searchParams: Record<
    string,
    string | string[] | undefined
  >
): Promise<PageData> {
  try {
    await db.connect();
    const finance =
      await assertFinanceModuleActive(context);
    const accountRepository = new FinanceAccountRepository(
      context
    );

    const [equityAccounts, paymentAccounts] =
      await Promise.all([
        accountRepository.list({
          type: 'equity',
          is_postable: true,
          limit: 500,
        }),
        accountRepository.listPostableBySubtypes(
          ['cash', 'bank'],
          { limit: 100 }
        ),
      ]);

    const ownerFilterAccounts = equityAccounts
      .filter(
        (account) => account.subtype === 'owner_drawings'
      )
      .map((account) => ({
        id: String(account._id),
        code: account.code,
        name: account.name,
      }));
    const selectableOwnerAccountIds = new Set(
      equityAccounts
        .filter(
          (account) =>
            account.subtype === 'owner_drawings' &&
            account.is_active
        )
        .map((account) => String(account._id))
    );
    const ownerAccounts = ownerFilterAccounts.filter(
      (account) => selectableOwnerAccountIds.has(account.id)
    );

    const businessDate = getFinanceCalendarDate(
      new Date(),
      finance.calendar_timezone
    );
    const defaultRange = getDefaultDateRange(businessDate);
    const fromDate = getSingleSearchParam(
      searchParams.from_date
    );
    const toDate = getSingleSearchParam(
      searchParams.to_date
    );
    const requestedOwnerAccountId = getSingleSearchParam(
      searchParams.owner_account_id
    );
    const filters = {
      from_date: fromDate ?? defaultRange.from_date,
      to_date: toDate ?? defaultRange.to_date,
      owner_account_id:
        requestedOwnerAccountId &&
        ownerFilterAccounts.some(
          (account) =>
            account.id === requestedOwnerAccountId
        )
          ? requestedOwnerAccountId
          : '',
    };
    const requestedQuery =
      FinanceOwnerWithdrawalListQuerySchema.safeParse({
        ...filters,
        page: getSingleSearchParam(searchParams.page),
        limit: getSingleSearchParam(searchParams.limit),
      });
    const listQuery = requestedQuery.success
      ? requestedQuery.data
      : FinanceOwnerWithdrawalListQuerySchema.parse({
          ...defaultRange,
        });
    const activeFilters = {
      from_date: listQuery.from_date,
      to_date: listQuery.to_date,
      owner_account_id: listQuery.owner_account_id ?? '',
    };

    const withdrawals =
      await new FinanceOwnerWithdrawalReadService(
        context
      ).list(listQuery);

    return {
      status: 'ready',
      ownerAccounts,
      ownerFilterAccounts,
      paymentAccounts: paymentAccounts.map((account) => ({
        id: String(account._id),
        code: account.code,
        name: account.name,
      })),
      withdrawals,
      filters: activeFilters,
      businessDate,
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

function getSingleSearchParam(
  value: string | string[] | undefined
) {
  return Array.isArray(value) ? value[0] : value;
}

function getDefaultDateRange(today: string) {
  const [year, month] = today.split('-').map(Number);
  const fromMonth = new Date(Date.UTC(year, month - 12, 1));
  const fromYear = fromMonth.getUTCFullYear();
  const fromMonthNumber = String(
    fromMonth.getUTCMonth() + 1
  ).padStart(2, '0');

  return {
    from_date: `${fromYear}-${fromMonthNumber}-01`,
    to_date: today,
  };
}

function UnavailableState() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>
            Penarikan pemilik tidak tersedia
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
