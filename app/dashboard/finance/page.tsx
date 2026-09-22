import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import {
  FinanceDomainError,
  FinanceLifecycleService,
  type FinanceState,
  type FinanceTenantContext,
} from '@/modules/finance';

export default async function FinancePage() {
  const tenantContext = await getTenantContext();

  if (!tenantContext.organizationId) {
    return <FinanceUnavailableState />;
  }

  const finance = await loadFinanceState(tenantContext);

  if (!finance) {
    return <FinanceUnavailableState />;
  }

  return <FinanceStateView finance={finance} />;
}

async function loadFinanceState(
  tenantContext: FinanceTenantContext
): Promise<FinanceState | null> {
  try {
    await db.connect();

    return await new FinanceLifecycleService(
      tenantContext
    ).getState();
  } catch (error) {
    if (
      error instanceof FinanceDomainError &&
      error.code === 'FINANCE_ORGANIZATION_NOT_FOUND'
    ) {
      return null;
    }

    throw error;
  }
}

function FinanceStateView({
  finance,
}: {
  finance: FinanceState;
}) {
  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="max-w-3xl space-y-2">
        <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
          Optional module
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight">
          Finance
        </h1>
        <p className="text-muted-foreground leading-7">
          Modul keuangan untuk transaksi, persediaan, saldo,
          jurnal, dan laporan keuangan.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>
            {finance.status === 'active'
              ? 'Finance aktif'
              : 'Finance belum aktif'}
          </CardTitle>
          <CardDescription>
            Status module: {finance.status}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          {finance.status === 'active'
            ? 'Finance siap digunakan. Fitur transaksi dan laporan akan tersedia melalui tahap berikutnya.'
            : 'Selesaikan onboarding Finance sebelum membuat transaksi atau jurnal.'}
          {finance.status !== 'active' && (
            <Link
              href="/dashboard/finance/onboarding"
              className={buttonVariants({
                variant: 'outline',
                className: 'mt-4',
              })}
            >
              Buka onboarding
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FinanceUnavailableState() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Finance tidak tersedia</CardTitle>
          <CardDescription>
            Organisasi aktif belum tersedia untuk membuka
            Finance.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
