import Link from 'next/link';
import { CheckmarkCircle01Icon } from '@hugeicons/core-free-icons';
import { id } from 'date-fns/locale';
import { HugeiconsIcon } from '@/components/icons/hugeicons-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { FinanceOpeningBalanceFinalizeResponseDTO } from '@/modules/finance/client';
import { fnsFormatDate } from '@/lib/date';

type FinanceOnboardingSuccessProps = {
  result?: FinanceOpeningBalanceFinalizeResponseDTO;
};

export function FinanceOnboardingSuccess({
  result,
}: FinanceOnboardingSuccessProps) {
  const openingBalanceSkipped =
    result?.status === 'skipped';

  return (
    <div className="@container/main flex flex-1 items-center justify-center p-4 md:p-6">
      <Card className="mx-auto w-full max-w-3xl">
        <CardHeader className="bg-muted/20 items-center justify-items-center gap-4 border-b px-6 py-9 text-center sm:px-10 sm:py-12">
          <div className="bg-success/10 text-success flex size-16 items-center justify-center rounded-full">
            <HugeiconsIcon
              icon={CheckmarkCircle01Icon}
              size={36}
            />
          </div>
          <Badge variant="success">Finance aktif</Badge>
          <CardTitle>Finance siap digunakan</CardTitle>
          <CardDescription className="max-w-xl text-sm leading-6 sm:text-base">
            {result
              ? openingBalanceSkipped
                ? 'Finance sudah diaktifkan untuk mulai mencatat transaksi dari nol. Tidak ada jurnal saldo awal yang dibuat.'
                : 'Saldo awal berhasil dicatat. Jurnal dan mutasi persediaan yang dibuat akan menjadi titik awal pencatatan Finance.'
              : 'Setup Finance organisasi ini sudah selesai. Anda dapat meninjau akun dan mulai menggunakan fitur Finance.'}
          </CardDescription>
        </CardHeader>

        {result ? (
          <CardContent className="p-6 sm:p-8">
            <dl className="grid gap-3 sm:grid-cols-2">
              <SuccessMetric
                label="Tanggal saldo awal"
                value={formatDate(result.cut_off_date)}
              />
              <SuccessMetric
                label="Jurnal pembuka"
                value={
                  result.journal_entry_id
                    ? 'Berhasil dibuat'
                    : 'Tidak diperlukan'
                }
              />
              <SuccessMetric
                label="Mutasi persediaan"
                value={String(
                  result.inventory_movement_count
                )}
              />
              <SuccessMetric
                label="Rincian utang / piutang"
                value={`${result.payable_item_count} / ${result.receivable_item_count}`}
              />
            </dl>
          </CardContent>
        ) : null}

        <CardFooter className="justify-center p-6 sm:p-8">
          <Button
            className="w-full sm:w-auto"
            size="lg"
            render={
              <Link href="/dashboard/finance/accounting/chart-of-accounts" />
            }
          >
            Lihat Chart of Accounts
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function SuccessMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-muted/30 flex flex-col gap-1 rounded-xl border p-4">
      <dt className="text-muted-foreground text-xs font-medium">
        {label}
      </dt>
      <dd className="text-sm font-semibold">{value}</dd>
    </div>
  );
}

function formatDate(value: string) {
  return fnsFormatDate(value, 'd MMMM yyyy', id);
}
