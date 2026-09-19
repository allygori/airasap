'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Link from 'next/link';
import { useStore } from '@tanstack/react-form';
import {
  Calendar01Icon,
  CheckmarkCircle01Icon,
  RefreshIcon,
  ScrollIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { useAppForm } from '@/components/form/form.hook';
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
import { Spinner } from '@/components/ui/spinner';
import AccountingScopeFilters from '../_components/accounting-scope-filters';
import {
  ACCOUNTING_PAGE_ICONS,
  AccountingPanel,
  AccountingStat,
  EMPTY_SCOPE_OPTIONS,
  formatIDR,
  getCurrentPeriod,
  JournalDetail,
  JournalTable,
  type ApiPayload,
  type JournalPayload,
  type JournalRow,
  TableSkeleton,
} from '../_components/accounting-ledger-ui';

const EMPTY_JOURNALS: JournalRow[] = [];

export default function AccountingJournalEntriesPage() {
  const periodForm = useAppForm({
    defaultValues: {
      period: getCurrentPeriod(),
    },
  });
  const period = useStore(
    periodForm.store,
    (state) => state.values.period
  );
  const [storeId, setStoreId] = useState('all');
  const [platform, setPlatform] = useState('all');
  const [payload, setPayload] =
    useState<JournalPayload | null>(null);
  const [selectedJournal, setSelectedJournal] =
    useState<JournalRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJournalEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSelectedJournal(null);

    const params = new URLSearchParams({
      period,
      limit: '100',
    });
    if (storeId !== 'all') params.set('store_id', storeId);
    if (platform !== 'all')
      params.set('platform', platform);

    try {
      const response = await fetch(
        `/api/v1/dashboard/accounting/journal-entries?${params.toString()}`,
        { cache: 'no-store' }
      );
      const result =
        (await response.json()) as ApiPayload<JournalPayload>;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.error?.message ||
            'Gagal memuat journal entries.'
        );
      }

      setPayload(result.data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Gagal memuat journal entries.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [period, platform, storeId]);

  useEffect(() => {
    // Journal entries stay synchronized with the selected tenant scope.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadJournalEntries();
  }, [loadJournalEntries]);

  const journals =
    payload?.journal_entries ?? EMPTY_JOURNALS;
  const postedCount = useMemo(
    () =>
      journals.filter(
        (journal) => journal.status === 'posted'
      ).length,
    [journals]
  );
  const totalDebit = useMemo(
    () =>
      journals.reduce(
        (sum, journal) => sum + journal.total_debit,
        0
      ),
    [journals]
  );
  const totalCredit = useMemo(
    () =>
      journals.reduce(
        (sum, journal) => sum + journal.total_credit,
        0
      ),
    [journals]
  );

  return (
    <main className="bg-muted/20 min-h-full overflow-x-hidden px-4 py-5 lg:px-8 lg:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="bg-foreground text-background relative overflow-hidden rounded-3xl px-6 py-7 shadow-2xl sm:px-8 sm:py-9">
          <div className="bg-primary/25 absolute -top-32 right-8 size-80 rounded-full blur-3xl" />
          <div className="bg-secondary/20 absolute -bottom-40 left-1/3 size-96 rounded-full blur-3xl" />
          <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="text-background/60 flex items-center gap-2 text-xs font-semibold tracking-[0.22em] uppercase">
                <HugeiconsIcon
                  icon={ScrollIcon}
                  size={15}
                />
                Accounting / journal register
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
                Journal Entries
              </h1>
              <p className="text-background/70 mt-5 max-w-2xl text-base leading-7 sm:text-lg">
                Satu register untuk membaca transaksi yang
                membentuk saldo accounting. Buka nomor entry
                untuk melihat line, sumber, dan total
                debit-credit-nya.
              </p>
            </div>
            <div className="border-background/15 bg-background/10 flex min-w-64 flex-col gap-3 rounded-2xl border p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-background/60 text-xs font-semibold tracking-[0.18em] uppercase">
                  Working period
                </span>
                <HugeiconsIcon
                  icon={Calendar01Icon}
                  size={18}
                />
              </div>
              <periodForm.AppField name="period">
                {(field) => (
                  <field.DateField
                    granularity="month"
                    className="w-full"
                    buttonVariant="ghost"
                    buttonClassName="w-full border-background/20 bg-background/10 text-background hover:bg-background/20 hover:text-background"
                    buttonProps={{
                      'aria-label':
                        'Filter periode journal entries',
                    }}
                  />
                )}
              </periodForm.AppField>
              <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
                <Button
                  variant="secondary"
                  onClick={() => void loadJournalEntries()}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <HugeiconsIcon
                      icon={RefreshIcon}
                      data-icon="inline-start"
                    />
                  )}
                  Refresh data
                </Button>
                <Button
                  render={
                    <Link href="/dashboard/accounting/journal-entries/create" />
                  }
                  className="flex-1"
                >
                  Tambah manual journal
                </Button>
              </div>
            </div>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Journal scope</CardTitle>
            <CardDescription>
              Saring transaksi berdasarkan store atau
              platform tanpa keluar dari register periode
              ini.
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
            <AlertTitle>
              Journal belum dapat dimuat
            </AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AccountingStat
            icon={ACCOUNTING_PAGE_ICONS.journal}
            label="Entries"
            value={String(journals.length)}
            hint="Entry pada periode terpilih"
          />
          <AccountingStat
            icon={CheckmarkCircle01Icon}
            label="Posted"
            value={String(postedCount)}
            hint="Entry yang sudah diposting"
          />
          <AccountingStat
            icon={ACCOUNTING_PAGE_ICONS.ledger}
            label="Total debit"
            value={formatIDR(totalDebit)}
            hint="Akumulasi response"
          />
          <AccountingStat
            icon={ACCOUNTING_PAGE_ICONS.ledger}
            label="Total credit"
            value={formatIDR(totalCredit)}
            hint="Akumulasi response"
          />
        </section>

        <AccountingPanel
          title="Journal register"
          description="Klik nomor entry untuk membaca line-level detail dan sumber transaksi. Data di halaman ini bersifat read-only."
          icon={ACCOUNTING_PAGE_ICONS.journal}
          action={
            <Badge variant="outline">
              {payload?.period.key ?? period}
            </Badge>
          }
        >
          {isLoading ? (
            <TableSkeleton columns={7} />
          ) : (
            <JournalTable
              rows={journals}
              onSelect={setSelectedJournal}
            />
          )}
        </AccountingPanel>

        {selectedJournal ? (
          <JournalDetail journal={selectedJournal} />
        ) : (
          <Card className="border-dashed">
            <CardContent className="text-muted-foreground flex items-center gap-3 p-5 text-sm">
              <HugeiconsIcon
                icon={ACCOUNTING_PAGE_ICONS.journal}
                size={20}
              />
              Pilih nomor journal entry untuk membuka detail
              line.
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
