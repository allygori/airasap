import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';
import {
  assertFinanceModuleActive,
  FinanceDomainError,
  FinanceSupplierListQuerySchema,
  FinanceSupplierService,
  type FinanceSupplierListResponseDTO,
  type FinanceTenantContext,
} from '@/modules/finance';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FinanceNotReadyState } from '../_components/finance-not-ready-state';
import { FinanceSuppliersClient } from './_components/suppliers.client';

type PageData =
  | {
      status: 'ready';
      suppliers: FinanceSupplierListResponseDTO;
    }
  | { status: 'unavailable' | 'not_ready' };

export default async function FinanceSuppliersPage() {
  const context = await getTenantContext();
  if (!context.organizationId) return <UnavailableState />;

  const data = await loadPageData(context);
  if (data.status !== 'ready') {
    return data.status === 'unavailable' ? (
      <UnavailableState />
    ) : (
      <FinanceNotReadyState
        title="Direktori supplier Finance belum tersedia"
        description="Aktifkan Finance melalui onboarding untuk mengelola supplier yang digunakan pada purchase."
        actionLabel="Lanjutkan onboarding"
      />
    );
  }

  return (
    <FinanceSuppliersClient initialData={data.suppliers} />
  );
}

async function loadPageData(
  context: FinanceTenantContext
): Promise<PageData> {
  try {
    await db.connect();
    await assertFinanceModuleActive(context);
    const suppliers = await new FinanceSupplierService(
      context
    ).list(
      FinanceSupplierListQuerySchema.parse({
        page: 1,
        limit: 25,
      })
    );
    return { status: 'ready', suppliers };
  } catch (error) {
    if (error instanceof FinanceDomainError) {
      if (error.code === 'FINANCE_ORGANIZATION_NOT_FOUND') {
        return { status: 'unavailable' };
      }
      if (error.code === 'FINANCE_NOT_ACTIVE') {
        return { status: 'not_ready' };
      }
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
            Direktori supplier tidak tersedia
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
