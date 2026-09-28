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
  type FinanceCashBankTransferListResponseDTO,
  type FinanceTenantContext,
} from '@/modules/finance';
import { FinanceNotReadyState } from '../_components/finance-not-ready-state';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FinanceCashBankTransferClient } from './_components/finance-cash-bank-transfer.client';

type PageData =
  | {
      status: 'ready';
      accounts: FinanceCashBankAccountDTO[];
      transfers: FinanceCashBankTransferListResponseDTO;
    }
  | { status: 'unavailable' | 'not_ready' };

export default async function CashAndBankTransfersPage() {
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
        title="Transfer antar akun kas dan bank"
        description="Aktifkan Finance untuk mencatat perpindahan dana antar rekening dan melihat jurnal transfernya."
      />
    );
  }

  return (
    <FinanceCashBankTransferClient
      accounts={data.accounts}
      transfers={data.transfers}
    />
  );
}

async function loadPageData(
  context: FinanceTenantContext
): Promise<PageData> {
  try {
    await db.connect();
    await assertFinanceModuleActive(context);

    const [cashBankData, transferData] = await Promise.all([
      new FinanceCashBankReadService(context).list(
        FinanceCashBankQuerySchema.parse({})
      ),
      new FinanceCashBankTransferReadService(context).list(
        FinanceCashBankTransferListQuerySchema.parse({})
      ),
    ]);

    return {
      status: 'ready',
      accounts: cashBankData.accounts,
      transfers: transferData,
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
            Transfer Kas & Bank tidak tersedia
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
