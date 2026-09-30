import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';
import {
  FINANCE_DEFAULT_CALENDAR_TIMEZONE,
  assertFinanceModuleActive,
  FinanceDomainError,
  FinanceOfflineSaleService,
  getFinanceCalendarDate,
  type FinanceOfflineSaleFormOptionsDTO,
  type FinanceTenantContext,
} from '@/modules/finance';
import { FinanceNotReadyState } from '../../_components/finance-not-ready-state';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FinanceOfflineSaleClient } from './_components/finance-offline-sale.client';

type PageState =
  | {
      status: 'ready';
      options: FinanceOfflineSaleFormOptionsDTO;
    }
  | { status: 'not_ready' | 'unavailable' };

export default async function FinanceOfflineSalePage() {
  const context = await getTenantContext();
  if (!context.organizationId) return <Unavailable />;
  const state = await loadOptions(context);
  if (state.status !== 'ready') {
    return state.status === 'unavailable' ? (
      <Unavailable />
    ) : (
      <FinanceNotReadyState
        title="Catat penjualan offline"
        description="Aktifkan Finance melalui onboarding untuk mencatat penjualan langsung dan mengurangi stok dengan jurnal yang sesuai."
        actionLabel="Lanjutkan onboarding"
      />
    );
  }

  return (
    <FinanceOfflineSaleClient
      options={state.options}
      initialDate={getFinanceCalendarDate(
        new Date(),
        FINANCE_DEFAULT_CALENDAR_TIMEZONE
      )}
    />
  );
}

async function loadOptions(
  context: FinanceTenantContext
): Promise<PageState> {
  try {
    await db.connect();
    await assertFinanceModuleActive(context);
    const options = await new FinanceOfflineSaleService(
      context
    ).getFormOptions();
    return { status: 'ready', options };
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

function Unavailable() {
  return (
    <StateCard
      title="Penjualan offline tidak tersedia"
      description="Organisasi aktif belum tersedia untuk membuka Finance."
    />
  );
}

function StateCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
