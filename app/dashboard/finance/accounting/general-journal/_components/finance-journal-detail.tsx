import Link from 'next/link';
import { formatMediumDate as formatDate } from '@/lib/date';
import { formatCurrency as formatMoney } from '@/lib/number/money';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  FinanceJournalDetailResponseDTO,
  FinanceJournalLineDetailDTO,
} from '@/modules/finance';

export function FinanceJournalDetail({
  data,
}: {
  data: FinanceJournalDetailResponseDTO;
}) {
  const journal = data.journal_entry;
  const totalDebit = journal.lines.reduce(
    (sum, line) => sum + line.debit,
    0
  );
  const totalCredit = journal.lines.reduce(
    (sum, line) => sum + line.credit,
    0
  );

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
            Finance / General Journal
          </p>
          <h1 className="font-mono text-3xl font-extrabold tracking-tight">
            {journal.entry_number}
          </h1>
          <p className="text-muted-foreground max-w-2xl leading-7">
            {journal.description}
          </p>
        </div>
        <Link
          href="/dashboard/finance/accounting/general-journal"
          className={buttonVariants({ variant: 'outline' })}
        >
          Kembali ke journal
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <InfoCard
          label="Tanggal"
          value={formatDate(journal.transaction_date)}
        />
        <InfoCard label="Periode" value={journal.period} />
        <InfoCard label="Status" value={journal.status} />
        <InfoCard
          label="Currency"
          value={journal.currency}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Source trace</CardTitle>
          <CardDescription>
            Journal ini dapat ditelusuri kembali ke
            transaksi asalnya.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-3">
          <TraceItem
            label="Source type"
            value={journal.source_type}
          />
          <TraceItem
            label="Source ID"
            value={journal.source_id}
            mono
          />
          <TraceItem
            label="Source event"
            value={journal.source_event}
          />
          <TraceItem
            label="Idempotency key"
            value={journal.idempotency_key}
            mono
          />
          <TraceItem
            label="Reversal of"
            value={journal.reversal_of ?? '—'}
            mono={Boolean(journal.reversal_of)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-end justify-between">
          <div>
            <CardTitle>Journal lines</CardTitle>
            <CardDescription>
              Lines posted tidak dapat diedit langsung.
            </CardDescription>
          </div>
          <Badge
            variant={
              journal.status === 'posted'
                ? 'success'
                : 'warning'
            }
          >
            {journal.status}
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Akun</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-right">
                  Debit
                </TableHead>
                <TableHead className="text-right">
                  Credit
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {journal.lines.map((line, index) => (
                <JournalLine
                  key={`${line.account_id}-${index}`}
                  line={line}
                  currency={journal.currency}
                />
              ))}
              <TableRow className="bg-muted/40 font-semibold">
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {formatMoney(
                    totalDebit,
                    journal.currency
                  )}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {formatMoney(
                    totalCredit,
                    journal.currency
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function JournalLine({
  line,
  currency,
}: {
  line: FinanceJournalLineDetailDTO;
  currency: string;
}) {
  return (
    <TableRow>
      <TableCell>
        <div className="grid gap-1">
          <span className="font-mono text-xs font-semibold">
            {line.account_code ?? 'UNKNOWN'}
          </span>
          <span className="text-muted-foreground text-xs">
            {line.account_name ?? 'Akun tidak ditemukan'}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {line.description ?? '—'}
      </TableCell>
      <TableCell className="text-right font-mono text-xs">
        {line.debit
          ? formatMoney(line.debit, currency)
          : '—'}
      </TableCell>
      <TableCell className="text-right font-mono text-xs">
        {line.credit
          ? formatMoney(line.credit, currency)
          : '—'}
      </TableCell>
    </TableRow>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-muted-foreground text-xs font-medium uppercase">
          {label}
        </p>
        <p className="font-medium">{value}</p>
      </CardContent>
    </Card>
  );
}

function TraceItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1">
      <span className="text-muted-foreground text-xs">
        {label}
      </span>
      <span
        className={
          mono ? 'font-mono text-xs' : 'font-medium'
        }
      >
        {value}
      </span>
    </div>
  );
}
