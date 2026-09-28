import { notFound } from 'next/navigation';
import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';
import {
  assertFinanceModuleActive,
  FinanceDomainError,
  FinanceJournalReadService,
  type FinanceJournalDetailResponseDTO,
  type FinanceTenantContext,
} from '@/modules/finance';
import { FinanceNotReadyState } from '../../../_components/finance-not-ready-state';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FinanceJournalDetail } from '../_components/finance-journal-detail';

type FinanceJournalDetailPageProps = {
  params: Promise<{ journalId: string }>;
};

type PageData =
  | {
      status: 'ready';
      data: FinanceJournalDetailResponseDTO;
    }
  | { status: 'unavailable' | 'not_ready' };

export default async function FinanceJournalDetailPage({
  params,
}: FinanceJournalDetailPageProps) {
  const tenantContext = await getTenantContext();

  if (!tenantContext.organizationId) {
    return <UnavailableState />;
  }

  const { journalId } = await params;
  const data = await loadPageData(tenantContext, journalId);

  if (data.status !== 'ready') {
    if (data.status === 'unavailable') {
      return <UnavailableState />;
    }
    return (
      <FinanceNotReadyState
        title="Buka detail jurnal"
        description="Selesaikan setup Finance untuk meninjau baris debit dan kredit pada jurnal ini."
      />
    );
  }

  return <FinanceJournalDetail data={data.data} />;
}

async function loadPageData(
  context: FinanceTenantContext,
  journalId: string
): Promise<PageData> {
  try {
    await db.connect();
    await assertFinanceModuleActive(context);
    const data = await new FinanceJournalReadService(
      context
    ).get(journalId);
    return { status: 'ready', data };
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

    if (
      error instanceof FinanceDomainError &&
      error.code === 'FINANCE_JOURNAL_NOT_FOUND'
    ) {
      notFound();
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
            Journal Finance tidak tersedia
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
