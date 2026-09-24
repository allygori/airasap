import Link from 'next/link';
import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  assertFinancePremium,
  FinanceDomainError,
  FinanceInventorySetupQuerySchema,
  FinanceInventorySetupService,
  type FinanceInventorySetupQueryDTO,
  type FinanceInventorySetupResponseDTO,
  type FinanceTenantContext,
} from '@/modules/finance';
import { FinanceInventorySetupClient } from './_components/finance-inventory-setup-client';

type FinanceInventorySetupPageProps = {
  searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
};

type PageData =
  | {
      status: 'ready';
      data: FinanceInventorySetupResponseDTO;
      query: FinanceInventorySetupQueryDTO;
    }
  | {
      status:
        | 'unavailable'
        | 'not_ready'
        | 'owner_required';
    };

export default async function FinanceInventorySetupPage({
  searchParams,
}: FinanceInventorySetupPageProps) {
  const tenantContext = await getTenantContext();
  if (!tenantContext.organizationId) {
    return <SetupUnavailableState />;
  }

  const params = searchParams ? await searchParams : {};
  const query = FinanceInventorySetupQuerySchema.parse({
    page: getParam(params.page),
    limit: getParam(params.limit) ?? '50',
    search: getParam(params.search),
    item_search: getParam(params.item_search),
  });
  const result = await loadPageData(tenantContext, query);

  if (result.status !== 'ready') {
    if (result.status === 'unavailable') {
      return <SetupUnavailableState />;
    }
    if (result.status === 'owner_required') {
      return <OwnerRequiredState />;
    }
    return <FinanceNotReadyState />;
  }

  return (
    <FinanceInventorySetupClient
      initialData={result.data}
      initialQuery={result.query}
    />
  );
}

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

async function loadPageData(
  context: FinanceTenantContext,
  query: FinanceInventorySetupQueryDTO
): Promise<PageData> {
  try {
    await db.connect();
    await assertFinancePremium(context);
    const data = await new FinanceInventorySetupService(
      context
    ).getSetup(query);
    return { status: 'ready', data, query };
  } catch (error: unknown) {
    if (
      error instanceof FinanceDomainError &&
      error.code === 'FINANCE_ORGANIZATION_NOT_FOUND'
    ) {
      return { status: 'unavailable' };
    }
    if (
      error instanceof FinanceDomainError &&
      error.code === 'FINANCE_OWNER_REQUIRED'
    ) {
      return { status: 'owner_required' };
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

function SetupUnavailableState() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>
            Inventory Finance tidak tersedia
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

function FinanceNotReadyState() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Finance belum dimulai</CardTitle>
          <CardDescription>
            Mulai onboarding Finance terlebih dahulu. Setup
            inventory tidak akan mengubah Orders atau
            Products.
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

function OwnerRequiredState() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>
            Setup awal perlu akses owner
          </CardTitle>
          <CardDescription>
            Selama onboarding Finance belum selesai, hanya
            owner organisasi yang dapat menyiapkan item dan
            lokasi inventory.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
