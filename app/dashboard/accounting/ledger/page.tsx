'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Activity01Icon,
  Calendar01Icon,
  RefreshIcon,
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
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import AccountingScopeFilters from '../_components/accounting-scope-filters';
import {
  ACCOUNTING_PAGE_ICONS,
  AccountingPanel,
  AccountingStat,
  EMPTY_SCOPE_OPTIONS,
  formatIDR,
  getCurrentPeriod,
  LedgerTable,
  type AccountRow,
  type ApiPayload,
  type LedgerPayload,
  TableSkeleton,
} from '../_components/accounting-ledger-ui';

const EMPTY_ACCOUNT_ROWS: AccountRow[] = [];
const EMPTY_LEDGER: NonNullable<LedgerPayload['ledger']> =
  [];

export default function AccountingLedgerPage() {
  const [period, setPeriod] = useState(getCurrentPeriod);
  const [storeId, setStoreId] = useState('all');
  const [platform, setPlatform] = useState('all');
  const [selectedAccount, setSelectedAccount] =
    useState('all');
  const [payload, setPayload] =
    useState<LedgerPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLedger = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({
      period,
      limit: '100',
    });
    if (selectedAccount !== 'all') {
      params.set('account_id', selectedAccount);
    }
    if (storeId !== 'all') params.set('store_id', storeId);
    if (platform !== 'all')
      params.set('platform', platform);

    try {
      const response = await fetch(
        `/api/v1/dashboard/accounting/ledger?${params.toString()}`,
        { cache: 'no-store' }
      );
      const result =
        (await response.json()) as ApiPayload<LedgerPayload>;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.error?.message ||
            'Gagal memuat general ledger.'
        );
      }

      setPayload(result.data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Gagal memuat general ledger.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [period, platform, selectedAccount, storeId]);

  useEffect(() => {
    // The ledger always reflects the active period and accounting scope.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLedger();
  }, [loadLedger]);

  const accounts: AccountRow[] =
    payload?.accounts ?? EMPTY_ACCOUNT_ROWS;
  const ledger = payload?.ledger ?? EMPTY_LEDGER;
  const postableAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.is_postable && account.is_active
      ),
    [accounts]
  );
  const totalDebit = useMemo(
    () => ledger.reduce((sum, row) => sum + row.debit, 0),
    [ledger]
  );
  const totalCredit = useMemo(
    () => ledger.reduce((sum, row) => sum + row.credit, 0),
    [ledger]
  );
  const activeAccountCount = useMemo(
    () => new Set(ledger.map((row) => row.account_id)).size,
    [ledger]
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
                  icon={ACCOUNTING_PAGE_ICONS.ledger}
                  size={15}
                />
                Accounting / movement register
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
                General Ledger
              </h1>
              <p className="text-background/70 mt-5 max-w-2xl text-base leading-7 sm:text-lg">
                Telusuri setiap posted journal line per
                account, lalu baca saldo berjalan yang
                mengikuti normal balance akun.
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
              <Input
                type="month"
                value={period}
                onChange={(event) =>
                  setPeriod(event.target.value)
                }
                className="border-background/20 bg-background/10 text-background"
                aria-label="Filter periode general ledger"
              />
              <Button
                variant="secondary"
                onClick={() => void loadLedger()}
                disabled={isLoading}
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
            </div>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Ledger lens</CardTitle>
            <CardDescription>
              Pilih scope dan account untuk mempersempit
              movement yang sedang dibaca.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
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
            <Field className="max-w-xl">
              <FieldLabel htmlFor="ledger-account-filter">
                Account
              </FieldLabel>
              <Select
                value={selectedAccount}
                onValueChange={(value) =>
                  setSelectedAccount(value || 'all')
                }
                disabled={isLoading}
              >
                <SelectTrigger
                  id="ledger-account-filter"
                  className="w-full"
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
              <FieldDescription>
                Ledger hanya menampilkan posted journal
                line.
              </FieldDescription>
            </Field>
          </CardContent>
        </Card>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>
              Ledger belum dapat dimuat
            </AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AccountingStat
            icon={ACCOUNTING_PAGE_ICONS.ledger}
            label="Ledger lines"
            value={String(ledger.length)}
            hint="Posted line pada response"
          />
          <AccountingStat
            icon={Activity01Icon}
            label="Active accounts"
            value={String(activeAccountCount)}
            hint="Account yang memiliki movement"
          />
          <AccountingStat
            icon={ACCOUNTING_PAGE_ICONS.ledger}
            label="Total debit"
            value={formatIDR(totalDebit)}
            hint="Movement periode terpilih"
          />
          <AccountingStat
            icon={ACCOUNTING_PAGE_ICONS.ledger}
            label="Total credit"
            value={formatIDR(totalCredit)}
            hint="Movement periode terpilih"
          />
        </section>

        <AccountingPanel
          title="General ledger register"
          description="Saldo berjalan dihitung dari posted journal line yang sudah difilter berdasarkan periode, scope, dan account."
          icon={ACCOUNTING_PAGE_ICONS.ledger}
          action={
            <Badge variant="outline">
              {payload?.period.key ?? period}
            </Badge>
          }
        >
          {isLoading ? (
            <TableSkeleton columns={7} />
          ) : (
            <LedgerTable rows={ledger} />
          )}
        </AccountingPanel>

        <Card className="border-dashed">
          <CardContent className="text-muted-foreground flex items-start gap-3 p-5 text-sm leading-6">
            <HugeiconsIcon
              icon={ACCOUNTING_PAGE_ICONS.ledger}
              size={20}
              className="text-primary mt-0.5 shrink-0"
            />
            <span>
              Debit dan credit tetap ditampilkan sebagai
              movement asli. Kolom saldo berjalan
              menggunakan normal balance account agar
              interpretasi saldo debit/credit tetap
              konsisten.
            </span>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
