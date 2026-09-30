'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { formatIDR as formatMoney } from '@/lib/number/money';
import { cn } from '@/lib/utils/ui';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  FinanceBalanceSheetReport,
  FinanceCashFlowReport,
  FinanceFinancialStatementReport,
  FinanceProfitLossReport,
  FinanceStatementAccountAmount,
  FinanceTrialBalanceReport,
} from '@/modules/finance/client';
import { FinanceReportPeriodForm } from './finance-report-period.form';

const REPORT_NAV = [
  {
    label: 'Neraca Saldo',
    path: '/dashboard/finance/reports/trial-balance',
    key: 'trial_balance',
  },
  {
    label: 'Laba Rugi',
    path: '/dashboard/finance/reports/profit-and-loss',
    key: 'profit_and_loss',
  },
  {
    label: 'Neraca',
    path: '/dashboard/finance/reports/balance-sheet',
    key: 'balance_sheet',
  },
  {
    label: 'Arus Kas',
    path: '/dashboard/finance/reports/cash-flow',
    key: 'cash_flow',
  },
] as const;

const statementTitle = (
  report: FinanceFinancialStatementReport
) => {
  switch (report.report_type) {
    case 'trial_balance':
      return 'Neraca Saldo';
    case 'profit_and_loss':
      return 'Laba Rugi';
    case 'balance_sheet':
      return 'Neraca';
    case 'cash_flow':
      return 'Arus Kas';
  }
};

export function FinanceFinancialStatementClient({
  report,
}: {
  report: FinanceFinancialStatementReport;
}) {
  const heading = statementTitle(report);
  const detail =
    report.report_type === 'profit_and_loss'
      ? 'Pergerakan pendapatan dan beban pada bulan yang dipilih.'
      : report.report_type === 'balance_sheet'
        ? 'Posisi aset, liabilitas, dan ekuitas sampai akhir bulan yang dipilih.'
        : report.report_type === 'cash_flow'
          ? 'Penerimaan dan pengeluaran Kas/Bank selama bulan yang dipilih.'
          : 'Saldo akhir akun berdasarkan jurnal Finance yang sudah diposting.';

  return (
    <main className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <header className="grid gap-5 border-b pb-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
              Finance / Laporan Keuangan
            </p>
            <Badge variant="outline">
              {getTimezoneLabel(
                report.period.calendar_timezone
              )}
            </Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {heading}
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-6">
            {detail} Nilai dihitung dari jurnal posted;
            jurnal draft, blocked, dan jurnal asal yang
            sudah direverse tidak menambah saldo.
          </p>
        </div>
        <FinanceReportPeriodForm
          key={report.period.period_key}
          period={report.period.period_key}
        />
      </header>

      <nav
        aria-label="Jenis laporan keuangan"
        className="flex flex-wrap gap-2"
      >
        {REPORT_NAV.map((item) => (
          <Link
            key={item.key}
            href={`${item.path}?period=${report.period.period_key}`}
            aria-current={
              item.key === report.report_type
                ? 'page'
                : undefined
            }
            className={buttonVariants({
              variant:
                item.key === report.report_type
                  ? 'secondary'
                  : 'ghost',
              size: 'sm',
            })}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Periode"
          value={report.period.period_key}
          detail={`${report.period.calendar_timezone} · ${report.period.start_date} – ${report.period.end_date}`}
          text
        />
        {report.report_type === 'trial_balance' ? (
          <>
            <SummaryCard
              label="Total debit"
              value={formatMoney(
                report.totals.debit_balance
              )}
            />
            <SummaryCard
              label="Total kredit"
              value={formatMoney(
                report.totals.credit_balance
              )}
            />
            <SummaryCard
              label="Selisih"
              value={formatMoney(report.totals.difference)}
              emphasized={report.totals.difference !== 0}
            />
          </>
        ) : report.report_type === 'profit_and_loss' ? (
          <>
            <SummaryCard
              label="Pendapatan bersih"
              value={formatMoney(
                report.totals.revenue +
                  report.totals.other_income
              )}
            />
            <SummaryCard
              label="Total beban"
              value={formatMoney(
                report.totals.cost_of_sales +
                  report.totals.expenses +
                  report.totals.other_expenses
              )}
            />
            <SummaryCard
              label="Laba / (rugi)"
              value={formatMoney(report.totals.net_income)}
              emphasized={report.totals.net_income < 0}
            />
          </>
        ) : report.report_type === 'balance_sheet' ? (
          <>
            <SummaryCard
              label="Total aset"
              value={formatMoney(report.totals.assets)}
            />
            <SummaryCard
              label="Liabilitas + ekuitas"
              value={formatMoney(
                report.totals.liabilities_and_equity
              )}
            />
            <SummaryCard
              label="Selisih neraca"
              value={formatMoney(report.totals.difference)}
              emphasized={report.totals.difference !== 0}
            />
          </>
        ) : (
          <>
            <SummaryCard
              label="Saldo awal Kas/Bank"
              value={formatMoney(
                report.totals.opening_cash_balance
              )}
            />
            <SummaryCard
              label="Perubahan kas bersih"
              value={formatMoney(
                report.totals.net_cash_change
              )}
              emphasized={report.totals.net_cash_change < 0}
            />
            <SummaryCard
              label="Saldo akhir Kas/Bank"
              value={formatMoney(
                report.totals.closing_cash_balance
              )}
            />
          </>
        )}
      </div>

      {report.period.history_start_date ? (
        <p className="text-muted-foreground text-xs">
          Tanggal mulai Finance yang dipilih saat
          onboarding:{' '}
          <span className="text-foreground font-medium">
            {report.period.history_start_date}
          </span>
          . Laporan tidak menyatakan histori sebelum tanggal
          itu lengkap.
        </p>
      ) : null}

      {report.report_type === 'profit_and_loss' ||
      report.report_type === 'balance_sheet' ? (
        <DeferredCogsAlert report={report} />
      ) : null}

      {report.report_type === 'cash_flow' ? (
        <CashFlowPolicyAlert report={report} />
      ) : null}

      {report.report_type === 'trial_balance' ? (
        <TrialBalanceTable report={report} />
      ) : report.report_type === 'profit_and_loss' ? (
        <ProfitLossReport report={report} />
      ) : report.report_type === 'balance_sheet' ? (
        <BalanceSheetReport report={report} />
      ) : (
        <CashFlowReport report={report} />
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  text = false,
  emphasized = false,
}: {
  label: string;
  value: string;
  detail?: string;
  text?: boolean;
  emphasized?: boolean;
}) {
  return (
    <Card size="sm" className="min-w-0">
      <CardHeader className="gap-1">
        <CardDescription>{label}</CardDescription>
        <CardTitle
          className={
            text
              ? 'text-xl tabular-nums'
              : 'text-lg font-semibold tabular-nums'
          }
        >
          <span
            className={
              emphasized ? 'text-destructive' : undefined
            }
          >
            {value}
          </span>
        </CardTitle>
        {detail ? (
          <p className="text-muted-foreground text-xs">
            {detail}
          </p>
        ) : null}
      </CardHeader>
    </Card>
  );
}

function TrialBalanceTable({
  report,
}: {
  report: FinanceTrialBalanceReport;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Saldo akhir per akun</CardTitle>
        <CardDescription>
          Klik akun untuk menelusuri jurnal yang membentuk
          saldonya.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {report.rows.length === 0 ? (
          <NoStatementActivity />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode akun</TableHead>
                <TableHead>Nama akun</TableHead>
                <TableHead className="text-right">
                  Debit
                </TableHead>
                <TableHead className="text-right">
                  Kredit
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.rows.map((row) => (
                <TableRow key={row.account_id}>
                  <TableCell className="font-mono text-xs">
                    <JournalDrilldownLink
                      accountId={row.account_id}
                      period={report.period.period_key}
                      cumulative
                    >
                      {row.code}
                    </JournalDrilldownLink>
                  </TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {row.debit_balance
                      ? formatMoney(row.debit_balance)
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {row.credit_balance
                      ? formatMoney(row.credit_balance)
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {formatMoney(report.totals.debit_balance)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {formatMoney(
                    report.totals.credit_balance
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ProfitLossReport({
  report,
}: {
  report: FinanceProfitLossReport;
}) {
  const hasRows =
    report.revenue_rows.length +
      report.other_income_rows.length +
      report.cost_of_sales_rows.length +
      report.expense_rows.length +
      report.other_expense_rows.length >
    0;

  return hasRows ? (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Rincian laba rugi</CardTitle>
          <CardDescription>
            Nilai mengikuti saldo normal akun; akun kontra
            seperti diskon atau retur mengurangi subtotal.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 py-5">
          <AccountSection
            title="Pendapatan"
            rows={report.revenue_rows}
            period={report.period.period_key}
          />
          <AccountSection
            title="Pendapatan lain-lain"
            rows={report.other_income_rows}
            period={report.period.period_key}
          />
          <AccountSection
            title="Harga pokok penjualan"
            rows={report.cost_of_sales_rows}
            period={report.period.period_key}
          />
          <AccountSection
            title="Beban operasional"
            rows={report.expense_rows}
            period={report.period.period_key}
          />
          <AccountSection
            title="Beban lain-lain"
            rows={report.other_expense_rows}
            period={report.period.period_key}
          />
        </CardContent>
      </Card>
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Ringkasan hasil</CardTitle>
          <CardDescription>
            Periode {report.period.period_key}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <TotalsLine
            label="Pendapatan"
            amount={report.totals.revenue}
          />
          <TotalsLine
            label="Pendapatan lain-lain"
            amount={report.totals.other_income}
          />
          <TotalsLine
            label="Harga pokok penjualan"
            amount={-report.totals.cost_of_sales}
          />
          <TotalsLine
            label="Beban operasional"
            amount={-report.totals.expenses}
          />
          <TotalsLine
            label="Beban lain-lain"
            amount={-report.totals.other_expenses}
          />
          <div className="flex items-baseline justify-between gap-4 border-t pt-4 font-semibold">
            <span>Laba / (rugi) bersih</span>
            <span className="font-mono tabular-nums">
              {formatMoney(report.totals.net_income)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  ) : (
    <NoStatementActivity />
  );
}

function BalanceSheetReport({
  report,
}: {
  report: FinanceBalanceSheetReport;
}) {
  const hasRows =
    report.asset_rows.length +
      report.liability_rows.length +
      report.equity_rows.length >
    0;

  return hasRows ? (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Aset</CardTitle>
          <CardDescription>
            Posisi sampai akhir {report.period.period_key}.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <AccountTable
            rows={report.asset_rows}
            period={report.period.period_key}
            cumulative
          />
          <TotalLine
            label="Total aset"
            amount={report.totals.assets}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Liabilitas dan ekuitas</CardTitle>
          <CardDescription>
            Laba/rugi yang belum ditutup ditampilkan sebagai
            bagian ekuitas agar posisi neraca tetap dapat
            ditelusuri.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 py-5">
          <AccountSection
            title="Liabilitas"
            rows={report.liability_rows}
            period={report.period.period_key}
            cumulative
          />
          <AccountSection
            title="Ekuitas"
            rows={report.equity_rows}
            period={report.period.period_key}
            cumulative
          />
          <TotalsLine
            label="Laba / (rugi) belum ditutup"
            amount={report.totals.unclosed_net_income}
          />
          <TotalLine
            label="Total liabilitas dan ekuitas"
            amount={report.totals.liabilities_and_equity}
          />
          <div className="flex items-baseline justify-between gap-4 border-t pt-4 text-sm font-semibold">
            <span>Selisih neraca</span>
            <span className="font-mono tabular-nums">
              {formatMoney(report.totals.difference)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  ) : (
    <NoStatementActivity />
  );
}

function CashFlowPolicyAlert({
  report,
}: {
  report: FinanceCashFlowReport;
}) {
  const hasUnclassified = report.lines.some(
    (line) => line.section === 'unclassified'
  );
  const hasOutsideScope = report.lines.some(
    (line) => line.section === 'outside_scope'
  );
  const hasReconciliationDifference =
    report.totals.reconciliation_difference !== 0;

  return (
    <div className="flex flex-col gap-3">
      <Alert>
        <AlertTitle>Basis laporan Arus Kas</AlertTitle>
        <AlertDescription>
          Metode langsung. Hanya akun Kas dan Bank yang
          dihitung sebagai kas. Saldo marketplace
          ditampilkan terpisah; pemindahan saldo marketplace
          ke bank menjadi penerimaan operasi. Transfer antar
          akun Kas/Bank diabaikan karena totalnya nol.
          E-wallet berada di luar cakupan kas laporan ini.
        </AlertDescription>
      </Alert>
      {hasReconciliationDifference ? (
        <Alert variant="destructive">
          <AlertTitle>
            Saldo kas belum dapat direkonsiliasi
          </AlertTitle>
          <AlertDescription>
            Selisih rekonsiliasi{' '}
            {formatMoney(
              report.totals.reconciliation_difference
            )}
            . Periksa bagian mutasi di luar cakupan dan
            belum terklasifikasi serta jurnal Kas/Bank
            periode ini.
          </AlertDescription>
        </Alert>
      ) : hasUnclassified || hasOutsideScope ? (
        <Alert>
          <AlertTitle>Perlu tinjauan</AlertTitle>
          <AlertDescription>
            Sebagian mutasi tetap ditampilkan di bagian “Di
            luar cakupan” atau “Perlu diklasifikasikan” agar
            saldo Kas/Bank tetap transparan.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

function CashFlowReport({
  report,
}: {
  report: FinanceCashFlowReport;
}) {
  const sections = [
    {
      section: 'opening_balance' as const,
      title: 'Saldo awal yang dicatat dalam periode',
      description:
        'Ditampilkan terpisah; bukan penerimaan operasi.',
    },
    {
      section: 'operating' as const,
      title: 'Aktivitas operasi',
      description:
        'Penerimaan dan pembayaran kegiatan usaha.',
    },
    {
      section: 'investing' as const,
      title: 'Aktivitas investasi',
      description:
        'Mutasi terkait pembelian atau pelepasan aset tetap.',
    },
    {
      section: 'financing' as const,
      title: 'Aktivitas pendanaan',
      description: 'Mutasi modal dan pembiayaan.',
    },
  ];
  const outsideScopeLines = report.lines.filter(
    (line) => line.section === 'outside_scope'
  );
  const unclassifiedLines = report.lines.filter(
    (line) => line.section === 'unclassified'
  );

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        {sections.map((item) => (
          <CashFlowSectionCard
            key={item.section}
            title={item.title}
            description={item.description}
            lines={report.lines.filter(
              (line) => line.section === item.section
            )}
            period={report.period.period_key}
          />
        ))}
        <CashFlowSectionCard
          title="Mutasi Kas/Bank di luar cakupan"
          description="Contohnya perpindahan Kas/Bank ke e-wallet atau saldo marketplace. Tidak masuk subtotal operasi, investasi, atau pendanaan, tetapi tetap ditampilkan untuk rekonsiliasi."
          lines={outsideScopeLines}
          period={report.period.period_key}
        />
        <CashFlowSectionCard
          title="Mutasi perlu diklasifikasikan"
          description="Mutasi ini masuk saldo akhir Kas/Bank, tetapi belum dapat dikategorikan otomatis."
          lines={unclassifiedLines}
          period={report.period.period_key}
          emphasize
        />
      </div>

      <aside className="flex flex-col gap-4">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Saldo marketplace</CardTitle>
            <CardDescription>
              Posisi sampai akhir periode; tidak termasuk
              Kas/Bank.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {report.marketplace_balances.length === 0 ? (
              <p className="text-muted-foreground px-5 py-4 text-sm">
                Belum ada akun saldo marketplace.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Akun</TableHead>
                    <TableHead className="text-right">
                      Saldo
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.marketplace_balances.map(
                    (account) => (
                      <TableRow key={account.account_id}>
                        <TableCell>
                          <JournalDrilldownLink
                            accountId={account.account_id}
                            period={
                              report.period.period_key
                            }
                            cumulative
                            className="grid gap-0.5"
                          >
                            <span className="font-mono text-xs">
                              {account.code}
                            </span>
                            <span>{account.name}</span>
                          </JournalDrilldownLink>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums">
                          {formatMoney(account.balance)}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>
                      Total saldo marketplace
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {formatMoney(
                        report.totals
                          .marketplace_balance_total
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rekonsiliasi Kas/Bank</CardTitle>
            <CardDescription>
              Perubahan bersih di luar subtotal standar ikut
              diperhitungkan sebagai penjelas saldo.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <TotalsLine
              label="Saldo awal"
              amount={report.totals.opening_cash_balance}
            />
            <TotalsLine
              label="Penyesuaian saldo awal periode"
              amount={
                report.totals.opening_balance_adjustment
              }
            />
            <TotalsLine
              label="Aktivitas operasi"
              amount={report.totals.operating_net}
            />
            <TotalsLine
              label="Aktivitas investasi"
              amount={report.totals.investing_net}
            />
            <TotalsLine
              label="Aktivitas pendanaan"
              amount={report.totals.financing_net}
            />
            <TotalsLine
              label="Di luar cakupan / belum diklasifikasikan"
              amount={report.totals.other_cash_movement_net}
            />
            <TotalLine
              label="Saldo akhir Kas/Bank"
              amount={report.totals.closing_cash_balance}
            />
            <p
              className={cn(
                'flex justify-between gap-3 border-t pt-3 text-xs',
                report.totals.reconciliation_difference !==
                  0
                  ? 'text-destructive font-medium'
                  : 'text-muted-foreground'
              )}
            >
              <span>Selisih rekonsiliasi</span>
              <span className="font-mono tabular-nums">
                {formatMoney(
                  report.totals.reconciliation_difference
                )}
              </span>
            </p>
            <p className="text-muted-foreground text-xs">
              Ditemukan {report.cash_account_count} akun
              Kas/Bank. E-wallet tidak dihitung sebagai kas
              pada laporan ini.
            </p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function CashFlowSectionCard({
  title,
  description,
  lines,
  period,
  emphasize = false,
}: {
  title: string;
  description: string;
  lines: FinanceCashFlowReport['lines'];
  period: string;
  emphasize?: boolean;
}) {
  const total = lines.reduce(
    (sum, line) => sum + line.amount,
    0
  );
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle
          className={
            emphasize
              ? 'text-amber-700 dark:text-amber-400'
              : undefined
          }
        >
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {lines.length === 0 ? (
          <p className="text-muted-foreground px-5 py-4 text-sm">
            Tidak ada mutasi pada periode ini.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jenis mutasi</TableHead>
                <TableHead className="text-right">
                  Jumlah
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => (
                <TableRow
                  key={`${line.section}-${line.source_type}-${line.label}`}
                >
                  <TableCell>
                    <JournalDrilldownLink
                      sourceType={line.source_type}
                      period={period}
                      className="grid gap-1"
                    >
                      <span>{line.label}</span>
                      <span className="text-muted-foreground text-xs">
                        {line.journal_count} jurnal ·{' '}
                        {line.source_type}
                      </span>
                    </JournalDrilldownLink>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {formatMoney(line.amount)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell>Subtotal</TableCell>
                <TableCell className="text-right font-mono text-xs tabular-nums">
                  {formatMoney(total)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function AccountSection({
  title,
  rows,
  period,
  cumulative = false,
}: {
  title: string;
  rows: FinanceStatementAccountAmount[];
  period: string;
  cumulative?: boolean;
}) {
  if (rows.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="flex flex-col divide-y">
        {rows.map((row) => (
          <div
            key={row.account_id}
            className="flex items-baseline justify-between gap-4 py-2 text-sm"
          >
            <div className="flex min-w-0 flex-col">
              <JournalDrilldownLink
                accountId={row.account_id}
                period={period}
                cumulative={cumulative}
                className="truncate"
              >
                {row.code} · {row.name}
              </JournalDrilldownLink>
            </div>
            <span className="shrink-0 font-mono text-xs tabular-nums">
              {formatMoney(row.amount)}
            </span>
          </div>
        ))}
      </div>
      {cumulative ? null : (
        <TotalsLine
          label={`Total ${title.toLocaleLowerCase('id-ID')}`}
          amount={rows.reduce(
            (sum, row) => sum + row.amount,
            0
          )}
        />
      )}
    </section>
  );
}

function AccountTable({
  rows,
  period,
  cumulative = false,
}: {
  rows: FinanceStatementAccountAmount[];
  period: string;
  cumulative?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Akun</TableHead>
          <TableHead className="text-right">
            Saldo
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.account_id}>
            <TableCell>
              <JournalDrilldownLink
                accountId={row.account_id}
                period={period}
                cumulative={cumulative}
                className="grid gap-0.5"
              >
                <span className="font-mono text-xs">
                  {row.code}
                </span>
                <span>{row.name}</span>
              </JournalDrilldownLink>
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {formatMoney(row.amount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TotalsLine({
  label,
  amount,
}: {
  label: string;
  amount: number;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums">
        {formatMoney(amount)}
      </span>
    </div>
  );
}

function TotalLine({
  label,
  amount,
}: {
  label: string;
  amount: number;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t px-4 py-4 font-semibold">
      <span>{label}</span>
      <span className="font-mono tabular-nums">
        {formatMoney(amount)}
      </span>
    </div>
  );
}

function DeferredCogsAlert({
  report,
}: {
  report:
    | FinanceProfitLossReport
    | FinanceBalanceSheetReport;
}) {
  if (report.deferred_cogs.transaction_count === 0)
    return null;

  return (
    <Alert>
      <AlertTitle>Sebagian HPP belum tercatat</AlertTitle>
      <AlertDescription>
        {report.deferred_cogs.transaction_count} transaksi
        dengan nilai penjualan{' '}
        {formatMoney(
          report.deferred_cogs.related_sales_amount
        )}{' '}
        masih memiliki HPP tertunda. Angka laba belum
        lengkap dan HPP tidak dianggap nol.
        {report.deferred_cogs.reasons.length > 0 ? (
          <ul className="mt-2 list-inside list-disc">
            {report.deferred_cogs.reasons.map((item) => (
              <li key={item.reason}>
                {item.reason} ({item.transaction_count}{' '}
                transaksi)
              </li>
            ))}
          </ul>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

function JournalDrilldownLink({
  accountId,
  sourceType,
  period,
  cumulative = false,
  className,
  children,
}: {
  accountId?: string;
  sourceType?: string;
  period: string;
  cumulative?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const params = new URLSearchParams();
  if (accountId) params.set('account_id', accountId);
  if (sourceType) params.set('source_type', sourceType);
  params.set(cumulative ? 'period_to' : 'period', period);
  params.set('status', 'posted');
  return (
    <Link
      href={`/dashboard/finance/accounting/general-journal?${params.toString()}`}
      className={cn(
        'underline-offset-4 hover:underline',
        className
      )}
    >
      {children}
    </Link>
  );
}

function getTimezoneLabel(timezone: string) {
  switch (timezone) {
    case 'Asia/Jakarta':
      return 'WIB';
    case 'Asia/Makassar':
      return 'WITA';
    case 'Asia/Jayapura':
      return 'WIT';
    default:
      return timezone;
  }
}

function NoStatementActivity() {
  return (
    <Card>
      <CardContent className="py-8">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>
              Belum ada jurnal pada periode ini
            </EmptyTitle>
            <EmptyDescription>
              Setelah transaksi Finance diposting, saldo
              akun akan muncul di laporan ini.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>
  );
}
