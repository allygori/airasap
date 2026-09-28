import { getSubledgerPageData } from '../_lib/load-subledger-page-data';
import { FinanceSubledgerPage } from '../_components/finance-subledger.client';
import { FinanceNotReadyState } from '../_components/finance-not-ready-state';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function AccountsReceivablePage() {
  const data = await getSubledgerPageData('receivable');
  if (data.status === 'ready') {
    return (
      <FinanceSubledgerPage
        balanceType={data.balanceType}
        balances={data.balances}
        paymentAccounts={data.paymentAccounts}
      />
    );
  }
  return data.status === 'unavailable' ? (
    <UnavailableState />
  ) : (
    <FinanceNotReadyState
      title="Pantau piutang usaha"
      description="Setelah setup Finance selesai, Anda dapat melihat saldo piutang dan pembayaran yang masih perlu ditagih."
    />
  );
}

function UnavailableState() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>
            Piutang Finance tidak tersedia
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
