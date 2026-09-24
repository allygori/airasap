import Link from 'next/link';
import type { ReactNode } from 'react';
import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';
import {
  assertFinanceModuleActive,
  FinanceDomainError,
  FinanceOfflineSaleService,
  type FinanceOfflineSaleFormOptionsDTO,
  type FinanceTenantContext,
} from '@/modules/finance';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
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
      <NotReady />
    );
  }

  return (
    <FinanceOfflineSaleClient
      options={state.options}
      initialDate={getBusinessDate()}
    />
  );
}

function getBusinessDate() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: 'year' | 'month' | 'day') =>
    parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
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

function NotReady() {
  return (
    <StateCard
      title="Finance belum aktif"
      description="Aktifkan Finance sebelum mencatat penjualan offline."
      action={
        <Link
          href="/dashboard/finance/onboarding"
          className={buttonVariants({ variant: 'outline' })}
        >
          Buka onboarding Finance
        </Link>
      }
    />
  );
}

function StateCard({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {action ? (
          <CardContent>{action}</CardContent>
        ) : null}
      </Card>
    </div>
  );
}
