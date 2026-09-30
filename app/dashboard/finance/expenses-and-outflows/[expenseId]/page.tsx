import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatMediumDate as formatDate } from '@/lib/date';
import { formatIDR as formatMoney } from '@/lib/number/money';
import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';
import {
  assertFinanceModuleActive,
  FinanceDomainError,
  FinanceExpenseReadService,
  type FinanceExpenseDetailResponseDTO,
  type FinanceTenantContext,
} from '@/modules/finance';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { FinanceNotReadyState } from '../../_components/finance-not-ready-state';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type ExpenseDetailPageProps = {
  params: Promise<{ expenseId: string }>;
};

export default async function FinanceExpenseDetailPage({
  params,
}: ExpenseDetailPageProps) {
  const { expenseId } = await params;
  const tenantContext = await getTenantContext();
  if (!tenantContext.organizationId)
    return <UnavailableState />;

  const data = await loadExpense(tenantContext, expenseId);
  if (data.status !== 'ready') {
    if (data.status === 'unavailable')
      return <UnavailableState />;
    if (data.status === 'not_ready')
      return (
        <FinanceNotReadyState
          title="Tinjau detail pengeluaran"
          description="Aktifkan Finance untuk membuka informasi transaksi pengeluaran dan jurnal yang terkait."
        />
      );
    notFound();
  }

  const expense = data.data.expense;
  const offsetAccount =
    expense.offset_account ?? expense.payment_account;

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/dashboard/finance/expenses-and-outflows"
            className="text-primary text-sm underline-offset-4 hover:underline"
          >
            ← Kembali ke expense
          </Link>
          <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
            Finance / Expense
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight">
            {expense.description}
          </h1>
          <p className="text-muted-foreground text-sm">
            {expense.category_account.code} —{' '}
            {expense.category_account.name} ·{' '}
            {formatDate(expense.expense_date)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              expense.status === 'posted'
                ? 'success'
                : 'warning'
            }
          >
            {expense.status === 'posted'
              ? 'Posted'
              : 'Draft'}
          </Badge>
          <Badge variant="outline">
            {expense.payment_timing === 'paid'
              ? 'Dibayar'
              : 'Utang'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Detail transaksi</CardTitle>
            <CardDescription>
              Detail ini tersimpan di Finance dan tidak
              mengubah modul Expense lama.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
            <InfoRow
              label="Nominal"
              value={formatMoney(expense.amount)}
            />
            <InfoRow
              label="Vendor / penerima"
              value={expense.vendor_name ?? '—'}
            />
            <InfoRow
              label="Referensi"
              value={expense.reference ?? '—'}
            />
            <InfoRow
              label="Akun lawan"
              value={
                offsetAccount
                  ? `${offsetAccount.code} — ${offsetAccount.name}`
                  : 'Belum ditentukan'
              }
            />
            <InfoRow
              label="Referensi lampiran"
              value={expense.attachment_reference ?? '—'}
            />
            <InfoRow
              label="Idempotency key"
              value={expense.idempotency_key}
            />
            {expense.notes ? (
              <div className="border-t pt-4 sm:col-span-2">
                <p className="text-muted-foreground text-xs font-semibold uppercase">
                  Catatan
                </p>
                <p className="mt-1 leading-6">
                  {expense.notes}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Jejak Finance</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <InfoRow
              label="Kategori"
              value={`${expense.category_account.code} — ${expense.category_account.name}`}
            />
            <InfoRow
              label="Pembayaran"
              value={
                expense.payment_timing === 'paid'
                  ? 'Sudah dibayar'
                  : 'Menjadi Utang Usaha'
              }
            />
            {expense.journal_entry_id ? (
              <Link
                href={`/dashboard/finance/accounting/general-journal/${expense.journal_entry_id}`}
                className={buttonVariants({
                  variant: 'outline',
                })}
              >
                Buka journal
              </Link>
            ) : (
              <p className="text-muted-foreground rounded-lg border border-dashed p-3 text-xs leading-5">
                Draft belum membuat journal atau mengubah
                saldo.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function loadExpense(
  context: FinanceTenantContext,
  expenseId: string
): Promise<
  | {
      status: 'ready';
      data: FinanceExpenseDetailResponseDTO;
    }
  | { status: 'unavailable' | 'not_ready' | 'not_found' }
> {
  try {
    await db.connect();
    await assertFinanceModuleActive(context);
    return {
      status: 'ready',
      data: await new FinanceExpenseReadService(
        context
      ).get(expenseId),
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
    if (
      error instanceof FinanceDomainError &&
      error.code === 'FINANCE_EXPENSE_NOT_FOUND'
    ) {
      return { status: 'not_found' };
    }
    throw error;
  }
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
      <p className="mt-1 font-medium break-words">
        {value}
      </p>
    </div>
  );
}

function UnavailableState() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>
            Expense Finance tidak tersedia
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
