import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FinanceDomainError,
  FinanceLifecycleService,
  type FinanceState,
  type FinanceTenantContext,
} from '@/modules/finance';
import FinanceOnboarding from './_components/finance-onboarding';

export default async function FinanceOnboardingPage() {
  const tenantContext = await getTenantContext();

  if (!tenantContext.organizationId) {
    return <FinanceUnavailableState />;
  }

  const finance = await loadFinanceState(tenantContext);

  if (!finance) {
    return <FinanceUnavailableState />;
  }

  return <FinanceOnboarding finance={finance} />;
}

async function loadFinanceState(
  tenantContext: FinanceTenantContext
): Promise<Pick<
  FinanceState,
  'status' | 'onboarding_version'
> | null> {
  try {
    await db.connect();

    const finance = await new FinanceLifecycleService(
      tenantContext
    ).getState();

    return {
      status: finance.status,
      onboarding_version: finance.onboarding_version,
    };
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

export type FinanceOnboardingState = Pick<
  FinanceState,
  'status' | 'onboarding_version'
>;
