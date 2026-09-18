'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  BookOpenCheck,
  CircleAlert,
  DatabaseZap,
  FileSearch,
  LoaderCircle,
  RefreshCw,
  ScrollText,
  SearchCheck,
} from 'lucide-react';
import Link from 'next/link';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Button,
  buttonVariants,
} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { formatIDR } from '@/lib/formatter/format-idr';
import AccountingScopeFilters from '../_components/accounting-scope-filters';
import type { AccountingScopeOptions } from '../_components/accounting-scope-filters';

type ExplorerView =
  | 'accounts'
  | 'journal-entries'
  | 'ledger';

type AccountRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  subtype: string | null;
  parent_account_id: string | null;
  normal_balance: 'debit' | 'credit';
  is_system: boolean;
  is_postable: boolean;
  is_active: boolean;
  description: string | null;
};

type JournalLine = {
  id: string;
  account_id: string;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  description: string | null;
  dimensions: Record<string, string> | null;
};

type JournalRow = {
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

type LedgerRow = {
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

type ExplorerPayload = {
  period: {
    key: string | null;
    from: string | null;
    to: string | null;
  };
  accounts?: AccountRow[];
  journal_entries?: JournalRow[];
  ledger?: LedgerRow[];
  filters?: AccountingScopeOptions;
};

type ApiPayload<T> = {
  success: boolean;
  data?: T;
  error?: { message?: string };
};

const getCurrentPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

const formatSource = (value: string | null) =>
  value?.replaceAll('_', ' ') || 'manual';

const EMPTY_ACCOUNTS: AccountRow[] = [];
const EMPTY_SCOPE_OPTIONS: AccountingScopeOptions = {
  stores: [],
  platforms: [],
};

export default function AccountingExplorer({
  defaultView,
}: {
  defaultView: ExplorerView;
}) {
  const router = useRouter();
  const [period, setPeriod] = useState(getCurrentPeriod);
  const [storeId, setStoreId] = useState('all');
  const [platform, setPlatform] = useState('all');
  const [selectedAccount, setSelectedAccount] =
    useState('all');
  const [payload, setPayload] =
    useState<ExplorerPayload | null>(null);
  const [selectedJournal, setSelectedJournal] =
    useState<JournalRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExplorer = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSelectedJournal(null);

    const params = new URLSearchParams({
      period,
      limit: '100',
    });
    if (
      defaultView === 'ledger' &&
      selectedAccount !== 'all'
    ) {
      params.set('account_id', selectedAccount);
    }
    if (storeId !== 'all') {
      params.set('store_id', storeId);
    }
    if (platform !== 'all') {
      params.set('platform', platform);
    }

    const endpoint =
      defaultView === 'accounts'
        ? '/api/v1/dashboard/accounting/accounts'
        : defaultView === 'journal-entries'
          ? '/api/v1/dashboard/accounting/journal-entries'
          : '/api/v1/dashboard/accounting/ledger';

    try {
      const response = await fetch(
        `${endpoint}?${params.toString()}`,
        {
          cache: 'no-store',
        }
      );
      const result =
        (await response.json()) as ApiPayload<ExplorerPayload>;
      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.error?.message ||
            'Gagal memuat accounting explorer.'
        );
      }
      setPayload(result.data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Gagal memuat accounting explorer.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    defaultView,
    period,
    platform,
    selectedAccount,
    storeId,
  ]);

  useEffect(() => {
    // The explorer is deliberately read-only and always reloads from a tenant-scoped API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadExplorer();
  }, [loadExplorer]);

  const accounts = payload?.accounts ?? EMPTY_ACCOUNTS;
  const journals = payload?.journal_entries ?? [];
  const ledger = payload?.ledger ?? [];
  const postableAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.is_postable && account.is_active
      ),
    [accounts]
  );

  const navigateTo = (view: string) => {
    if (
      view === 'accounts' ||
      view === 'journal-entries' ||
      view === 'ledger'
    ) {
      router.push(`/dashboard/accounting/explorer/${view}`);
    }
  };

  return (
    <main className="bg-muted/20 min-h-full overflow-x-hidden px-4 py-5 lg:px-8 lg:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="bg-foreground text-background relative overflow-hidden rounded-3xl px-6 py-7 shadow-2xl sm:px-8 sm:py-9">
          <div className="bg-primary/30 absolute -top-24 right-12 size-72 rounded-full blur-3xl" />
          <div className="bg-secondary/20 absolute -bottom-32 left-1/3 size-80 rounded-full blur-3xl" />
          <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <Badge
                variant="outline"
                className="border-background/20 text-background gap-1.5"
              >
                <SearchCheck data-icon="inline-start" />{' '}
                Accounting explorer
              </Badge>
              <p className="text-background/60 mt-5 text-xs font-semibold tracking-[0.24em] uppercase">
                Audit room · read only
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">
                Buka kap accounting-nya.
              </h1>
              <p className="text-background/70 mt-5 max-w-2xl text-base leading-7 sm:text-lg">
                Lihat akun, journal entry, dan baris ledger
                yang membentuk angka di Finance Desk. Semua
                data di halaman ini bersifat read-only.
              </p>
            </div>
            <div className="bg-background/10 border-background/15 flex min-w-64 flex-col gap-3 rounded-2xl border p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-background/60 text-xs tracking-[0.18em] uppercase">
                  Filter periode
                </span>
                <DatabaseZap />
              </div>
              <Input
                type="month"
                value={period}
                onChange={(event) =>
                  setPeriod(event.target.value)
                }
                className="border-background/20 bg-background/10 text-background"
                aria-label="Filter periode accounting explorer"
              />
              <Button
                variant="secondary"
                onClick={() => void loadExplorer()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoaderCircle
                    className="animate-spin"
                    data-icon="inline-start"
                  />
                ) : (
                  <RefreshCw data-icon="inline-start" />
                )}
                Refresh data
              </Button>
              {defaultView === 'journal-entries' ? (
                <Link
                  href="/dashboard/accounting/journal-entries/create"
                  className={buttonVariants({
                    variant: 'default',
                    className: 'w-full justify-center',
                  })}
                >
                  Tambah manual journal
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Scope explorer</CardTitle>
            <CardDescription>
              Gunakan filter dimensi untuk menelusuri angka
              organization, workspace, atau platform
              tertentu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AccountingScopeFilters
              options={
                payload?.filters ?? EMPTY_SCOPE_OPTIONS
              }
              storeId={storeId}
              platform={platform}
              onStoreChange={setStoreId}
              onPlatformChange={setPlatform}
              disabled={isLoading}
            />
          </CardContent>
        </Card>

        {error ? (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle>
              Data explorer belum dapat dimuat
            </AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-3">
          <ExplorerStat
            icon={BookOpenCheck}
            label="Chart of Accounts"
            value={String(accounts.length)}
            hint="Akun tenant aktif"
          />
          <ExplorerStat
            icon={ScrollText}
            label="Journal entries"
            value={String(journals.length)}
            hint="Entry dalam response"
          />
          <ExplorerStat
            icon={FileSearch}
            label="Ledger rows"
            value={String(ledger.length)}
            hint="Line posted yang terlihat"
          />
        </section>

        <Tabs
          value={defaultView}
          onValueChange={navigateTo}
          className="gap-5"
        >
          <TabsList className="w-full justify-start overflow-x-auto sm:w-fit">
            <TabsTrigger value="accounts">
              Chart of Accounts
            </TabsTrigger>
            <TabsTrigger value="journal-entries">
              Journal Entries
            </TabsTrigger>
            <TabsTrigger value="ledger">
              General Ledger
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accounts">
            <ExplorerCard
              title="Chart of Accounts"
              description="Daftar akun yang tersedia untuk posting. Group account tetap terlihat agar struktur CoA tidak terasa seperti kode tersembunyi."
              icon={BookOpenCheck}
            >
              {isLoading ? (
                <TableSkeleton columns={6} />
              ) : (
                <AccountsTable rows={accounts} />
              )}
            </ExplorerCard>
          </TabsContent>

          <TabsContent
            value="journal-entries"
            className="flex flex-col gap-4"
          >
            <ExplorerCard
              title="Journal Entries"
              description="Header journal dan total debit/credit. Klik nomor entry untuk melihat seluruh line dan sumber transaksinya."
              icon={ScrollText}
            >
              {isLoading ? (
                <TableSkeleton columns={7} />
              ) : (
                <JournalTable
                  rows={journals}
                  onSelect={setSelectedJournal}
                />
              )}
            </ExplorerCard>
            {selectedJournal ? (
              <JournalDetail journal={selectedJournal} />
            ) : null}
          </TabsContent>

          <TabsContent value="ledger">
            <ExplorerCard
              title="General Ledger"
              description="Ledger diturunkan dari journal posted. Saldo berjalan dihitung mengikuti normal balance akun."
              icon={FileSearch}
              action={
                <Select
                  value={selectedAccount}
                  onValueChange={(value) =>
                    setSelectedAccount(value || 'all')
                  }
                >
                  <SelectTrigger
                    className="w-full sm:w-72"
                    aria-label="Pilih akun ledger"
                  >
                    <SelectValue placeholder="Semua akun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">
                        Semua akun
                      </SelectItem>
                      {postableAccounts.map((account) => (
                        <SelectItem
                          key={account.id}
                          value={account.id}
                        >
                          {account.code} · {account.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              }
            >
              {isLoading ? (
                <TableSkeleton columns={7} />
              ) : (
                <LedgerTable rows={ledger} />
              )}
            </ExplorerCard>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function ExplorerStat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof BookOpenCheck;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-sm">
            {label}
          </span>
          <span className="text-2xl font-semibold tracking-tight">
            {value}
          </span>
          <span className="text-muted-foreground text-xs">
            {hint}
          </span>
        </div>
        <Icon className="text-primary" />
      </CardContent>
    </Card>
  );
}

function ExplorerCard({
  title,
  description,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  description: string;
  icon: typeof BookOpenCheck;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-card border-b">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-xl">
              <Icon />
            </div>
            <div className="flex flex-col gap-1">
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

function AccountsTable({ rows }: { rows: AccountRow[] }) {
  if (!rows.length)
    return (
      <ExplorerEmpty message="Belum ada account pada organization ini. Jalankan setup accounting terlebih dahulu." />
    );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kode</TableHead>
          <TableHead>Nama akun</TableHead>
          <TableHead>Tipe</TableHead>
          <TableHead>Subtype</TableHead>
          <TableHead>Normal balance</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-mono text-xs font-semibold">
              {row.code}
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <span className="font-medium">
                  {row.name}
                </span>
                {row.description ? (
                  <span className="text-muted-foreground max-w-xs truncate text-xs">
                    {row.description}
                  </span>
                ) : null}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {row.type.replaceAll('_', ' ')}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {row.subtype?.replaceAll('_', ' ') || '—'}
            </TableCell>
            <TableCell className="capitalize">
              {row.normal_balance}
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                <Badge
                  variant={
                    row.is_active ? 'secondary' : 'outline'
                  }
                >
                  {row.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline">
                  {row.is_postable ? 'Postable' : 'Group'}
                </Badge>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function JournalTable({
  rows,
  onSelect,
}: {
  rows: JournalRow[];
  onSelect: (row: JournalRow) => void;
}) {
  if (!rows.length)
    return (
      <ExplorerEmpty message="Belum ada journal entry pada periode yang dipilih." />
    );
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
                <ArrowUpRight data-icon="inline-end" />
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

function JournalDetail({
  journal,
}: {
  journal: JournalRow;
}) {
  return (
    <Card className="border-primary/30">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardDescription className="font-mono">
              {journal.entry_number} · {journal.period}
            </CardDescription>
            <CardTitle className="mt-1">
              {journal.description}
            </CardTitle>
          </div>
          <Badge variant="secondary">
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
        <div className="flex justify-end gap-8 text-sm font-semibold">
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

function LedgerTable({ rows }: { rows: LedgerRow[] }) {
  if (!rows.length)
    return (
      <ExplorerEmpty message="Belum ada posted journal line pada periode atau akun yang dipilih." />
    );
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

function ExplorerEmpty({ message }: { message: string }) {
  return (
    <Alert className="m-4">
      <CircleAlert />
      <AlertTitle>
        Belum ada data untuk ditampilkan
      </AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function TableSkeleton({ columns }: { columns: number }) {
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
