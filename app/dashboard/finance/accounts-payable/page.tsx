import { getSubledgerPageData } from '../_lib/load-subledger-page-data';
import { FinanceSubledgerPage } from '../_components/finance-subledger.client';
import { FinanceNotReadyState } from '../_components/finance-not-ready-state';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function AccountsPayablePage() {
  const data = await getSubledgerPageData('payable');
  if (data.status === 'ready') {
    return (
      <FinanceSubledgerPage
        balanceType={data.balanceType}
        balances={data.balances}
        paymentAccounts={data.paymentAccounts}
        cashLoanBalances={data.cashLoanBalances}
      />
    );
  }
  return data.status === 'unavailable' ? (
    <UnavailableState />
  ) : (
    <FinanceNotReadyState
      title="Pantau saldo utang usaha"
      description="Selesaikan setup Finance untuk melihat dan mengelola saldo utang usaha organisasi Anda."
    />
  );
}

function UnavailableState() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>
            Hutang Finance tidak tersedia
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
