import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';
import {
  assertFinanceModuleActive,
  FinanceCashBankQuerySchema,
  FinanceCashBankReadService,
  FinanceCashBankTransferListQuerySchema,
  FinanceCashBankTransferReadService,
  FinanceDomainError,
  type FinanceCashBankAccountDTO,
  type FinanceCashBankTransferSummaryDTO,
  type FinanceTenantContext,
} from '@/modules/finance';
import { FinanceNotReadyState } from '../_components/finance-not-ready-state';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FinanceMarketplaceWithdrawalClient } from './_components/finance-marketplace-withdrawal.client';

type PageData =
  | {
      status: 'ready';
      marketplaceBalance: FinanceCashBankAccountDTO | null;
      destinations: FinanceCashBankAccountDTO[];
      withdrawals: FinanceCashBankTransferSummaryDTO[];
    }
  | { status: 'unavailable' | 'not_ready' };

export default async function MarketplaceWithdrawalsPage() {
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
        title="Penarikan Marketplace"
        description="Aktifkan Finance untuk mencatat penarikan dana dari saldo Marketplace ke rekening Bank atau E-wallet."
      />
    );
  }

  return (
    <FinanceMarketplaceWithdrawalClient
      marketplaceBalance={data.marketplaceBalance}
      destinations={data.destinations}
      withdrawals={data.withdrawals}
    />
  );
}

async function loadPageData(
  context: FinanceTenantContext
): Promise<PageData> {
  try {
    await db.connect();
    await assertFinanceModuleActive(context);

    const cashBankData =
      await new FinanceCashBankReadService(context).list(
        FinanceCashBankQuerySchema.parse({
          status: 'active',
          limit: 100,
        })
      );
    const marketplaceBalance =
      cashBankData.accounts.find(
        (account) =>
          account.subtype === 'marketplace_balance'
      ) ?? null;
    const destinations = cashBankData.accounts.filter(
      (account) =>
        account.subtype === 'bank' ||
        account.subtype === 'e_wallet'
    );
    const withdrawals = marketplaceBalance
      ? (
          await new FinanceCashBankTransferReadService(
            context
          ).list(
            FinanceCashBankTransferListQuerySchema.parse({
              page: 1,
              limit: 10,
              source_account_id: marketplaceBalance.id,
            })
          )
        ).transfers
      : [];

    return {
      status: 'ready',
      marketplaceBalance,
      destinations,
      withdrawals,
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
            Penarikan Marketplace tidak tersedia
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
