import Link from 'next/link';
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
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
      paymentAccounts: AccountOption[];
      withdrawals: FinanceOwnerWithdrawalListResponseDTO;
      businessDate: string;
    }
  | { status: 'unavailable' | 'not_ready' };

export default async function OwnerWithdrawalsPage() {
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
    <FinanceOwnerWithdrawalClient
      ownerAccounts={data.ownerAccounts}
      paymentAccounts={data.paymentAccounts}
      withdrawals={data.withdrawals}
      businessDate={data.businessDate}
    />
  );
}

async function loadPageData(
  context: FinanceTenantContext
): Promise<PageData> {
  try {
    await db.connect();
    const finance =
      await assertFinanceModuleActive(context);
    const accountRepository = new FinanceAccountRepository(
      context
    );

    const [equityAccounts, paymentAccounts, withdrawals] =
      await Promise.all([
        accountRepository.list({
          type: 'equity',
          is_active: true,
          is_postable: true,
          limit: 500,
        }),
        accountRepository.listPostableBySubtypes(
          ['cash', 'bank'],
          { limit: 100 }
        ),
        new FinanceOwnerWithdrawalReadService(context).list(
          FinanceOwnerWithdrawalListQuerySchema.parse({})
        ),
      ]);

    const ownerAccounts = equityAccounts
      .filter(
        (account) => account.subtype === 'owner_drawings'
      )
      .map((account) => ({
        id: String(account._id),
        code: account.code,
        name: account.name,
      }));

    return {
      status: 'ready',
      ownerAccounts,
      paymentAccounts: paymentAccounts.map((account) => ({
        id: String(account._id),
        code: account.code,
        name: account.name,
      })),
      withdrawals,
      businessDate: getFinanceCalendarDate(
        new Date(),
        finance.calendar_timezone
      ),
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

function NotReadyState() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Finance belum aktif</CardTitle>
          <CardDescription>
            Penarikan pemilik tersedia setelah onboarding
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
