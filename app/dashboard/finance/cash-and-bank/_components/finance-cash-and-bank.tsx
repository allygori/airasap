import Link from 'next/link';
import { formatIDR as formatMoney } from '@/lib/number/money';
import {
  type FinanceCashBankQueryDTO,
  type FinanceCashBankResponseDTO,
  type FinanceCashBankManagedAccountsResponseDTO,
} from '@/modules/finance';
import { Card, CardContent } from '@/components/ui/card';
import { FinanceCashBankAccountManager } from './finance-cash-bank-account-manager';

type FinanceCashAndBankProps = {
  data: FinanceCashBankResponseDTO;
  managedAccounts: FinanceCashBankManagedAccountsResponseDTO;
  query: FinanceCashBankQueryDTO;
};

export function FinanceCashAndBank({
  data,
  managedAccounts,
  query,
}: FinanceCashAndBankProps) {
  const activeAccountCount = data.accounts.filter(
    (account) => account.is_active
  ).length;
  const inactiveAccountCount =
    data.accounts.length - activeAccountCount;

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="bg-card relative overflow-hidden rounded-2xl border p-6 shadow-sm md:p-8">
        <div className="bg-primary/10 pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-primary text-xs font-bold tracking-[0.22em] uppercase">
              Finance / Keuangan
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
              Cash & Bank
            </h1>
            <p className="text-muted-foreground max-w-xl leading-7">
              Satu pandangan untuk kas toko, rekening bank,
              e-wallet, dan saldo marketplace. Saldo
              dihitung dari journal Finance yang sudah
              posted.
            </p>
          </div>
          <Link
            href="/dashboard/finance/accounting/chart-of-accounts"
            className={ButtonLinkClass}
          >
            Kelola Chart of Accounts →
          </Link>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard
          label="Total saldo"
          value={formatMoney(data.meta.total_balance)}
          detail="Saldo akun yang tampil, termasuk rekening nonaktif"
          accent="primary"
        />
        <SummaryCard
          label="Akun aktif"
          value={String(activeAccountCount)}
          detail={`${inactiveAccountCount} nonaktif · ${data.meta.accounts_with_activity} memiliki aktivitas journal`}
          accent="amber"
        />
        <SummaryCard
          label="Sumber saldo"
          value="Journal posted"
          detail="Journal reversed tidak dihitung ulang"
          accent="slate"
        />
      </div>

      <FinanceCashBankAccountManager
        accounts={data.accounts}
        initialManagedAccounts={managedAccounts.accounts}
        query={query}
      />

      <p className="text-muted-foreground text-xs">
        Rekonsiliasi bank dan import mutasi belum termasuk
        dalam phase ini.
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  accent: 'primary' | 'amber' | 'slate';
}) {
  const accentClass = {
    primary: 'border-l-primary',
    amber: 'border-l-amber-500',
    slate: 'border-l-slate-400',
  }[accent];

  return (
    <Card className={`border-l-4 ${accentClass}`}>
      <CardContent className="space-y-2 p-4">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {label}
        </p>
        <p className="text-2xl font-semibold tracking-tight">
          {value}
        </p>
        <p className="text-muted-foreground text-xs">
          {detail}
        </p>
      </CardContent>
    </Card>
  );
}

const ButtonLinkClass =
  'border-primary/30 text-primary hover:bg-primary/5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors';
