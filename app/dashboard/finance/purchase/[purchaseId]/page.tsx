import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatMediumDate as formatDate } from '@/lib/date';
import { formatIDR as formatMoney } from '@/lib/number/money';
import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';
import {
  assertFinanceModuleActive,
  FinanceDomainError,
  FinancePurchaseReadService,
  type FinancePurchaseDetailResponseDTO,
  type FinanceTenantContext,
} from '@/modules/finance';
import { FinanceNotReadyState } from '../../_components/finance-not-ready-state';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type PurchaseDetailPageProps = {
  params: Promise<{ purchaseId: string }>;
};

export default async function FinancePurchaseDetailPage({
  params,
}: PurchaseDetailPageProps) {
  const { purchaseId } = await params;
  const tenantContext = await getTenantContext();
  if (!tenantContext.organizationId) {
    return <UnavailableState />;
  }

  const data = await loadPurchase(
    tenantContext,
    purchaseId
  );
  if (data.status !== 'ready') {
    if (data.status === 'unavailable')
      return <UnavailableState />;
    if (data.status === 'not_ready') {
      return (
        <FinanceNotReadyState
          title="Tinjau detail pembelian"
          description="Aktifkan Finance melalui onboarding untuk melihat detail purchase, mutasi stok, dan jurnal terkait."
          actionLabel="Lanjutkan onboarding"
        />
      );
    }
    notFound();
  }

  const purchase = data.data.purchase;
  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/dashboard/finance/purchase"
            className="text-primary text-sm underline-offset-4 hover:underline"
          >
            ← Kembali ke purchase
          </Link>
          <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
            Finance / Purchase
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight">
            {purchase.supplier_name_snapshot ??
              'Purchase tanpa supplier'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {purchase.supplier_document_reference ??
              'Tanpa nomor referensi'}{' '}
            · {formatDate(purchase.transaction_date)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              purchase.status === 'posted'
                ? 'success'
                : 'warning'
            }
          >
            {purchase.status === 'posted'
              ? 'Posted'
              : 'Draft'}
          </Badge>
          <Badge variant="outline">
            {purchase.payment_timing === 'paid'
              ? 'Dibayar'
              : 'Utang'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Barang purchase</CardTitle>
            <CardDescription>
              Line ini menjadi inventory movement saat
              purchase diposting.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {purchase.lines.map((line) => (
                <div
                  key={`${line.item_id}-${line.location_id}`}
                  className="grid gap-2 px-6 py-4 sm:grid-cols-[minmax(0,1fr)_auto]"
                >
                  <div>
                    <p className="font-medium">
                      {line.item_sku} — {line.item_name}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {line.quantity}{' '}
                      {line.quantity === 1
                        ? 'unit'
                        : 'unit'}{' '}
                      · {line.location_code} —{' '}
                      {line.location_name}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-mono text-sm font-semibold">
                      {formatMoney(line.line_total)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatMoney(line.unit_cost)} / unit
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-muted/25 flex items-center justify-between border-t px-6 py-4">
              <span className="font-semibold">Total</span>
              <span className="font-mono text-lg font-bold">
                {formatMoney(purchase.total_amount)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Jejak Finance</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <InfoRow
              label="Pembayaran"
              value={getAccountLabel(purchase)}
            />
            <InfoRow
              label="Movement"
              value={`${purchase.inventory_movement_ids.length} inventory movement`}
            />
            {purchase.journal_entry_id ? (
              <Link
                href={`/dashboard/finance/accounting/general-journal/${purchase.journal_entry_id}`}
                className={buttonVariants({
                  variant: 'outline',
                })}
              >
                Buka journal
              </Link>
            ) : (
              <p className="text-muted-foreground rounded-lg border border-dashed p-3 text-xs leading-5">
                Draft belum membuat journal atau mengubah
                saldo inventory.
              </p>
            )}
            {purchase.notes ? (
              <div className="border-t pt-4">
                <p className="text-muted-foreground text-xs font-semibold uppercase">
                  Catatan
                </p>
                <p className="mt-1 leading-6">
                  {purchase.notes}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function loadPurchase(
  context: FinanceTenantContext,
  purchaseId: string
): Promise<
  | {
      status: 'ready';
      data: FinancePurchaseDetailResponseDTO;
    }
  | { status: 'unavailable' | 'not_ready' | 'not_found' }
> {
  try {
    await db.connect();
    await assertFinanceModuleActive(context);
    const data = await new FinancePurchaseReadService(
      context
    ).get(purchaseId);
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
      error.code === 'FINANCE_PURCHASE_NOT_FOUND'
    ) {
      return { status: 'not_found' };
    }
    throw error;
  }
}

function getAccountLabel(
  purchase: FinancePurchaseDetailResponseDTO['purchase']
) {
  const account =
    purchase.offset_account ?? purchase.payment_account;
  return account
    ? `${account.code} — ${account.name}`
    : 'Belum ditentukan';
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs uppercase">
        {label}
      </p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function UnavailableState() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>
            Purchase Finance tidak tersedia
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
