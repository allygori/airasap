import Link from 'next/link';
import { getSubledgerPageData } from '../_lib/load-subledger-page-data';
import { FinanceSubledgerPage } from '../_components/finance-subledger.client';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
      />
    );
  }
  return data.status === 'unavailable' ? (
    <UnavailableState />
  ) : (
    <NotReadyState />
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

function NotReadyState() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Finance belum aktif</CardTitle>
          <CardDescription>
            Hutang tersedia setelah onboarding Finance
            selesai.
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
