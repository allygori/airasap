'use client';

import type { ReactNode } from 'react';
import {
  AlertCircleIcon,
  ArrowUpRight01Icon,
  BookOpenCheckIcon,
  FileSearchIcon,
  ScrollIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatIDR } from '@/lib/formatter/format-idr';
import type { IconSvgObject } from '@/types/icon';
import type { AccountingScopeOptions } from './accounting-scope-filters';

export { formatIDR } from '@/lib/formatter/format-idr';

export type AccountRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  is_active: boolean;
  is_postable: boolean;
};

export type JournalLine = {
  id: string;
  account_id: string;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  description: string | null;
  dimensions: Record<string, string> | null;
};

export type JournalRow = {
  id: string;
  entry_number: string;
  transaction_date: string;
  posting_date: string;
  period: string;
  description: string;
  source_type: string | null;
  source_id: string | null;
  source_event: string | null;
  status: string;
  total_debit: number;
  total_credit: number;
  lines: JournalLine[];
};

export type LedgerRow = {
  id: string;
  journal_entry_id: string;
  entry_number: string;
  transaction_date: string;
  posting_date: string;
  description: string;
  source_type: string | null;
  account_id: string;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  running_balance: number;
};

export type AccountingPeriod = {
  key: string | null;
  from: string | null;
  to: string | null;
};

export type ApiPayload<T> = {
  success: boolean;
  data?: T;
  error?: { message?: string };
};

export type JournalPayload = {
  period: AccountingPeriod;
  journal_entries?: JournalRow[];
  filters?: AccountingScopeOptions;
};

export type LedgerPayload = {
  period: AccountingPeriod;
  accounts?: AccountRow[];
  ledger?: LedgerRow[];
  filters?: AccountingScopeOptions;
};

export const EMPTY_SCOPE_OPTIONS: AccountingScopeOptions = {
  stores: [],
  platforms: [],
};

export const getCurrentPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

export const formatSource = (value: string | null) =>
  value?.replaceAll('_', ' ') || 'manual';

export function AccountingStat({
  icon,
  label,
  value,
  hint,
}: {
  icon: IconSvgObject;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-muted-foreground text-sm">
            {label}
          </span>
          <span className="truncate text-2xl font-semibold tracking-tight">
            {value}
          </span>
          <span className="text-muted-foreground text-xs">
            {hint}
          </span>
        </div>
        <div className="bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-xl">
          <HugeiconsIcon icon={icon} size={20} />
        </div>
      </CardContent>
    </Card>
  );
}

export function AccountingPanel({
  title,
  description,
  icon,
  action,
  children,
}: {
  title: string;
  description: string;
  icon: IconSvgObject;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-xl">
              <HugeiconsIcon icon={icon} size={20} />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <CardTitle>{title}</CardTitle>
              <CardDescription className="max-w-3xl leading-6">
                {description}
              </CardDescription>
            </div>
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

export function JournalTable({
  rows,
  onSelect,
}: {
  rows: JournalRow[];
  onSelect: (row: JournalRow) => void;
}) {
  if (!rows.length) {
    return (
      <ExplorerEmpty message="Belum ada journal entry pada periode atau scope yang dipilih." />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tanggal</TableHead>
          <TableHead>Entry</TableHead>
          <TableHead>Deskripsi</TableHead>
          <TableHead>Sumber</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">
            Debit
          </TableHead>
          <TableHead className="text-right">
            Credit
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="text-muted-foreground whitespace-nowrap">
              {formatDate(row.transaction_date)}
            </TableCell>
            <TableCell>
              <Button
                variant="link"
                className="h-auto p-0 font-mono text-xs"
                onClick={() => onSelect(row)}
              >
                {row.entry_number}
                <HugeiconsIcon
                  icon={ArrowUpRight01Icon}
                  data-icon="inline-end"
                />
              </Button>
            </TableCell>
            <TableCell className="min-w-56 font-medium">
              {row.description}
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {formatSource(row.source_type)}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  row.status === 'posted'
                    ? 'secondary'
                    : 'outline'
                }
              >
                {row.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatIDR(row.total_debit)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatIDR(row.total_credit)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function JournalDetail({
  journal,
}: {
  journal: JournalRow;
}) {
  return (
    <Card className="border-primary/30">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardDescription className="font-mono">
              {journal.entry_number} · {journal.period}
            </CardDescription>
            <CardTitle className="mt-1 truncate">
              {journal.description}
            </CardTitle>
          </div>
          <Badge variant="secondary" className="w-fit">
            {journal.status}
          </Badge>
        </div>
        <CardDescription>
          Transaction {formatDate(journal.transaction_date)}{' '}
          · Posting {formatDate(journal.posting_date)} ·
          Source {formatSource(journal.source_type)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {journal.source_id ? (
          <p className="text-muted-foreground font-mono text-xs break-all">
            source_id: {journal.source_id}
          </p>
        ) : null}
        <Separator />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Akun</TableHead>
              <TableHead>Line description</TableHead>
              <TableHead className="text-right">
                Debit
              </TableHead>
              <TableHead className="text-right">
                Credit
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {journal.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell>
                  <span className="text-muted-foreground mr-2 font-mono text-xs">
                    {line.account_code}
                  </span>
                  {line.account_name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {line.description || '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {line.debit ? formatIDR(line.debit) : '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {line.credit
                    ? formatIDR(line.credit)
                    : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex flex-wrap justify-end gap-x-8 gap-y-2 text-sm font-semibold">
          <span>
            Debit {formatIDR(journal.total_debit)}
          </span>
          <span>
            Credit {formatIDR(journal.total_credit)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function LedgerTable({
  rows,
}: {
  rows: LedgerRow[];
}) {
  if (!rows.length) {
    return (
      <ExplorerEmpty message="Belum ada posted journal line pada periode, scope, atau akun yang dipilih." />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tanggal</TableHead>
          <TableHead>Entry</TableHead>
          <TableHead>Akun</TableHead>
          <TableHead>Deskripsi</TableHead>
          <TableHead className="text-right">
            Debit
          </TableHead>
          <TableHead className="text-right">
            Credit
          </TableHead>
          <TableHead className="text-right">
            Saldo berjalan
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="text-muted-foreground whitespace-nowrap">
              {formatDate(row.transaction_date)}
            </TableCell>
            <TableCell className="font-mono text-xs">
              {row.entry_number}
            </TableCell>
            <TableCell>
              <span className="text-muted-foreground mr-2 font-mono text-xs">
                {row.account_code}
              </span>
              {row.account_name}
            </TableCell>
            <TableCell className="min-w-56">
              {row.description}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.debit ? formatIDR(row.debit) : '—'}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.credit ? formatIDR(row.credit) : '—'}
            </TableCell>
            <TableCell className="text-right font-semibold tabular-nums">
              {formatIDR(row.running_balance)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ExplorerEmpty({
  message,
}: {
  message: string;
}) {
  return (
    <Alert className="m-4">
      <HugeiconsIcon icon={AlertCircleIcon} size={18} />
      <AlertTitle>
        Belum ada data untuk ditampilkan
      </AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export function TableSkeleton({
  columns,
}: {
  columns: number;
}) {
  return (
    <div className="flex flex-col gap-3 p-4">
      {Array.from({ length: 6 }, (_, row) => (
        <div key={row} className="flex gap-4">
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton key={column} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export const ACCOUNTING_PAGE_ICONS = {
  journal: ScrollIcon,
  ledger: FileSearchIcon,
  accounts: BookOpenCheckIcon,
} as const;
