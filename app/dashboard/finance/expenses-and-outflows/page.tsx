import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';
import {
  assertFinanceModuleActive,
  FINANCE_CASH_BANK_SUBTYPE_VALUES,
  FinanceDomainError,
  FinanceExpenseListQuerySchema,
  FinanceExpenseReadService,
  type FinanceExpenseListResponseDTO,
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
import { FinanceExpenseClient } from './_components/finance-expense.client';

type ExpenseAccountOption = {
  id: string;
  code: string;
  name: string;
  type: 'expense' | 'other_expense';
};

type PaymentAccountOption = {
  id: string;
  code: string;
  name: string;
  subtype: string | null;
};

type PageData =
  | {
      status: 'ready';
      categoryAccounts: ExpenseAccountOption[];
      paymentAccounts: PaymentAccountOption[];
      expenses: FinanceExpenseListResponseDTO;
    }
  | { status: 'unavailable' | 'not_ready' };

export default async function FinanceExpensesAndOutflowsPage() {
  const tenantContext = await getTenantContext();
  if (!tenantContext.organizationId) {
    return <UnavailableState />;
  }

  const data = await loadPageData(tenantContext);
  if (data.status !== 'ready') {
    return data.status === 'unavailable' ? (
      <UnavailableState />
    ) : (
      <FinanceNotReadyState
        title="Catat pengeluaran usaha"
        description="Selesaikan setup Finance untuk mencatat pengeluaran, pembayaran, dan arus kas keluar usaha."
      />
    );
  }

  return (
    <FinanceExpenseClient
      categoryAccounts={data.categoryAccounts}
      paymentAccounts={data.paymentAccounts}
      expenses={data.expenses}
    />
  );
}

async function loadPageData(
  context: FinanceTenantContext
): Promise<PageData> {
  try {
    await db.connect();
    await assertFinanceModuleActive(context);

    const accountRepository = new FinanceAccountRepository(
      context
    );
    const [
      expenseAccounts,
      otherExpenseAccounts,
      paymentAccounts,
      expenses,
    ] = await Promise.all([
      accountRepository.list({
        type: 'expense',
        is_active: true,
        is_postable: true,
        limit: 100,
      }),
      accountRepository.list({
        type: 'other_expense',
        is_active: true,
        is_postable: true,
        limit: 100,
      }),
      accountRepository.listPostableBySubtypes(
        [...FINANCE_CASH_BANK_SUBTYPE_VALUES],
        { limit: 100 }
      ),
      new FinanceExpenseReadService(context).list(
        FinanceExpenseListQuerySchema.parse({})
      ),
    ]);

    return {
      status: 'ready',
      categoryAccounts: [
        ...expenseAccounts,
        ...otherExpenseAccounts,
      ].map((account) => ({
        id: String(account._id),
        code: account.code,
        name: account.name,
        type: account.type as 'expense' | 'other_expense',
      })),
      paymentAccounts: paymentAccounts.map((account) => ({
        id: String(account._id),
        code: account.code,
        name: account.name,
        subtype: account.subtype ?? null,
      })),
      expenses,
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
            Expense Finance tidak tersedia
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
