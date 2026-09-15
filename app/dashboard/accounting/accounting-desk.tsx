'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Boxes,
  CalendarDays,
  Check,
  CircleDollarSign,
  ClipboardPenLine,
  LoaderCircle,
  Package,
  ReceiptText,
  RefreshCw,
  Sparkles,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
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
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
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
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';
import { formatIDR } from '@/lib/formatter/format-idr';

type Flow = 'expense' | 'purchase' | 'consumption';

type AccountOption = {
  _id: string;
  code: string;
  name: string;
  type: string;
  is_postable: boolean;
  normal_balance: 'debit' | 'credit';
};

type InventoryItemOption = {
  _id: string;
  sku: string;
  name: string;
  item_type: string;
  unit: string;
};

type LocationOption = {
  _id: string;
  code: string;
  name: string;
  type: string;
};

type BootstrapData = {
  accounts: AccountOption[];
  inventoryItems: InventoryItemOption[];
  locations: LocationOption[];
  openPeriod: { period_key: string } | null;
  currentPeriodKey: string;
};

type ApiPayload<T> = {
  success: boolean;
  data?: T;
  error?: { message?: string };
};

const getToday = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(
    2,
    '0'
  );
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const cleanPayload = (payload: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(payload).filter(
      ([, value]) => value !== '' && value !== undefined
    )
  );

export default function AccountingDesk() {
  const [bootstrap, setBootstrap] =
    useState<BootstrapData | null>(null);
  const [flow, setFlow] = useState<Flow>('expense');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    expense_account: '',
    payment_account: '',
    expense_date: getToday(),
    vendor_name: '',
    description: '',
  });
  const [purchaseForm, setPurchaseForm] = useState({
    inventory_item: '',
    location: '',
    quantity: '1',
    unit_cost: '',
    offset_account: '',
    occurred_at: getToday(),
    reference: '',
  });
  const [consumptionForm, setConsumptionForm] = useState({
    inventory_item: '',
    location: '',
    quantity: '1',
    occurred_at: getToday(),
    reference: '',
  });

  const loadBootstrap = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        '/api/v1/dashboard/accounting/bootstrap',
        { cache: 'no-store' }
      );
      const payload =
        (await response.json()) as ApiPayload<BootstrapData>;
      if (
        !response.ok ||
        !payload.success ||
        !payload.data
      ) {
        throw new Error(
          payload.error?.message ||
            'Gagal memuat accounting workspace.'
        );
      }
      setBootstrap(payload.data);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : 'Gagal memuat accounting workspace.';
      setError(message);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    // The bootstrap request synchronizes this client with the tenant-scoped API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBootstrap();
  }, []);

  const expenseAccounts = useMemo(
    () =>
      bootstrap?.accounts.filter(
        (account) =>
          account.is_postable &&
          ['expense', 'other_expense'].includes(
            account.type
          )
      ) ?? [],
    [bootstrap]
  );
  const paymentAccounts = useMemo(
    () =>
      bootstrap?.accounts.filter(
        (account) =>
          account.is_postable &&
          ['asset', 'liability', 'equity'].includes(
            account.type
          )
      ) ?? [],
    [bootstrap]
  );
  const packagingItems = useMemo(
    () =>
      bootstrap?.inventoryItems.filter(
        (item) => item.item_type === 'packaging'
      ) ?? [],
    [bootstrap]
  );
  const defaultExpenseAccount =
    expenseAccounts[0]?._id ?? '';
  const defaultPurchaseItem =
    bootstrap?.inventoryItems[0]?._id ?? '';
  const defaultPackagingItem = packagingItems[0]?._id ?? '';
  const defaultLocation =
    bootstrap?.locations[0]?._id ?? '';
  const isReady = Boolean(
    bootstrap?.openPeriod &&
    bootstrap.accounts.length > 0 &&
    bootstrap.locations.length > 0
  );

  const runSetup = async () => {
    setIsSettingUp(true);
    setError(null);
    try {
      const response = await fetch(
        '/api/v1/dashboard/accounting/setup',
        { method: 'POST' }
      );
      const payload =
        (await response.json()) as ApiPayload<unknown>;
      if (!response.ok || !payload.success) {
        throw new Error(
          payload.error?.message ||
            'Gagal menyiapkan accounting workspace.'
        );
      }
      toast.success('Accounting workspace siap digunakan.');
      await loadBootstrap(true);
    } catch (setupError) {
      const message =
        setupError instanceof Error
          ? setupError.message
          : 'Gagal menyiapkan accounting workspace.';
      setError(message);
      toast.error(message);
    } finally {
      setIsSettingUp(false);
    }
  };

  const submitFlow = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const endpoint =
      flow === 'expense'
        ? '/api/v1/dashboard/expenses'
        : flow === 'purchase'
          ? '/api/v1/dashboard/inventory/purchases'
          : '/api/v1/dashboard/inventory/consumptions';
    const body =
      flow === 'expense'
        ? cleanPayload({
            amount: Number(expenseForm.amount),
            expense_account:
              expenseForm.expense_account ||
              defaultExpenseAccount,
            payment_account: expenseForm.payment_account,
            expense_date: expenseForm.expense_date,
            vendor_name: expenseForm.vendor_name,
            description: expenseForm.description,
            status: 'draft',
          })
        : cleanPayload({
            inventory_item:
              flow === 'purchase'
                ? purchaseForm.inventory_item ||
                  defaultPurchaseItem
                : consumptionForm.inventory_item ||
                  defaultPackagingItem,
            location:
              flow === 'purchase'
                ? purchaseForm.location || defaultLocation
                : consumptionForm.location ||
                  defaultLocation,
            quantity: Number(
              flow === 'purchase'
                ? purchaseForm.quantity
                : consumptionForm.quantity
            ),
            unit_cost:
              flow === 'purchase'
                ? Number(purchaseForm.unit_cost)
                : undefined,
            offset_account:
              flow === 'purchase'
                ? purchaseForm.offset_account
                : undefined,
            occurred_at: `${
              flow === 'purchase'
                ? purchaseForm.occurred_at
                : consumptionForm.occurred_at
            }T00:00:00.000Z`,
            reference:
              flow === 'purchase'
                ? purchaseForm.reference
                : consumptionForm.reference,
            movement_type:
              flow === 'purchase'
                ? 'purchase'
                : 'consumption',
            status: 'draft',
          });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload =
        (await response.json()) as ApiPayload<unknown>;
      if (!response.ok || !payload.success) {
        throw new Error(
          payload.error?.message ||
            'Transaksi gagal diposting.'
        );
      }

      toast.success(
        flow === 'expense'
          ? 'Expense tercatat dan journal diposting.'
          : flow === 'purchase'
            ? 'Pembelian inventory tercatat.'
            : 'Konsumsi packaging tercatat.'
      );
      await loadBootstrap(true);
      if (flow === 'expense') {
        setExpenseForm((current) => ({
          ...current,
          amount: '',
          vendor_name: '',
          description: '',
        }));
      } else if (flow === 'purchase') {
        setPurchaseForm((current) => ({
          ...current,
          quantity: '1',
          unit_cost: '',
          reference: '',
        }));
      } else {
        setConsumptionForm((current) => ({
          ...current,
          quantity: '1',
          reference: '',
        }));
      }
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'Transaksi gagal diposting.';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-full flex-col gap-6 p-4 lg:p-8">
        <Skeleton className="h-56 w-full rounded-3xl" />
        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </main>
    );
  }

  return (
    <main className="bg-muted/20 min-h-full overflow-x-hidden px-4 py-5 lg:px-8 lg:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="bg-foreground text-background relative overflow-hidden rounded-3xl px-6 py-7 shadow-2xl sm:px-8 sm:py-9">
          <div className="bg-primary/30 absolute -top-24 right-12 size-72 rounded-full blur-3xl" />
          <div className="bg-secondary/20 absolute -bottom-32 left-1/3 size-80 rounded-full blur-3xl" />
          <div className="relative grid gap-8 xl:grid-cols-[1fr_auto] xl:items-end">
            <div className="max-w-2xl">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-background/20 text-background"
                >
                  <Sparkles data-icon="inline-start" />
                  Phase 6A · Finance desk
                </Badge>
                <Badge
                  variant={isReady ? 'success' : 'warning'}
                  className="border-0"
                >
                  {isReady
                    ? 'Ready to post'
                    : 'Setup required'}
                </Badge>
              </div>
              <p className="text-background/60 text-xs font-semibold tracking-[0.24em] uppercase">
                Pasaria operating system
              </p>
              <h1 className="mt-3 max-w-xl text-4xl leading-[0.98] font-semibold tracking-tight sm:text-6xl">
                Catat uang dan stok selagi ceritanya masih
                hangat.
              </h1>
              <p className="text-background/70 mt-5 max-w-xl text-base leading-7 sm:text-lg">
                Satu input operasional akan membuat
                subledger dan journal yang bisa ditelusuri.
                Tidak ada pencatatan langsung ke ledger.
              </p>
            </div>
            <div className="bg-background/10 border-background/15 grid min-w-56 gap-4 rounded-2xl border p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-background/60 text-xs tracking-[0.18em] uppercase">
                  Active period
                </span>
                <CalendarDays />
              </div>
              <p className="text-3xl font-semibold">
                {bootstrap?.openPeriod?.period_key ??
                  bootstrap?.currentPeriodKey}
              </p>
              <p className="text-background/60 text-sm">
                {isReady
                  ? 'Posting masuk ke periode terbuka.'
                  : 'Siapkan CoA dan periode bulan ini.'}
              </p>
            </div>
          </div>
        </section>

        {error ? (
          <Alert variant="destructive">
            <ClipboardPenLine />
            <AlertTitle>
              Workspace belum bisa menyelesaikan transaksi
            </AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {!isReady ? (
          <Alert className="border-warning/30 bg-warning/5">
            <RefreshCw />
            <AlertTitle>
              Aktifkan fondasi accounting
            </AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-4">
              <span>
                Sistem akan menyiapkan default Chart of
                Accounts dan periode accounting bulan ini.
              </span>
              <Button
                size="sm"
                onClick={runSetup}
                disabled={isSettingUp}
              >
                {isSettingUp ? (
                  <LoaderCircle
                    className="animate-spin"
                    data-icon="inline-start"
                  />
                ) : (
                  <RefreshCw data-icon="inline-start" />
                )}
                {isSettingUp
                  ? 'Menyiapkan…'
                  : 'Siapkan sekarang'}
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          <Card className="border-foreground/10 overflow-hidden">
            <CardHeader className="bg-card border-b">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardDescription className="tracking-[0.18em] uppercase">
                    Daily operations
                  </CardDescription>
                  <CardTitle className="mt-2 text-2xl">
                    Pilih kejadian bisnis
                  </CardTitle>
                </div>
                <Boxes className="text-primary" />
              </div>
              <p className="text-muted-foreground text-sm leading-6">
                Widget hanya menjadi pintu masuk. Source of
                truth tetap berada pada journal yang
                tervalidasi.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-4">
              <ToggleGroup
                value={[flow]}
                onValueChange={(value: unknown) => {
                  const next = value as string[];
                  if (next[0]) setFlow(next[0] as Flow);
                }}
                orientation="vertical"
                variant="outline"
                className="w-full gap-3"
              >
                <ToggleGroupItem
                  value="expense"
                  className="h-auto w-full justify-start rounded-2xl px-4 py-4 text-left"
                >
                  <ReceiptText data-icon="inline-start" />
                  <span className="flex flex-col items-start gap-1">
                    <span className="font-semibold">
                      Catat expense
                    </span>
                    <span className="text-muted-foreground text-xs font-normal">
                      Bubble wrap, iklan, software, gaji
                      operasional
                    </span>
                  </span>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="purchase"
                  className="h-auto w-full justify-start rounded-2xl px-4 py-4 text-left"
                >
                  <Package data-icon="inline-start" />
                  <span className="flex flex-col items-start gap-1">
                    <span className="font-semibold">
                      Beli inventory
                    </span>
                    <span className="text-muted-foreground text-xs font-normal">
                      Produk dagang atau bahan packing masuk
                      stok
                    </span>
                  </span>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="consumption"
                  className="h-auto w-full justify-start rounded-2xl px-4 py-4 text-left"
                >
                  <Boxes data-icon="inline-start" />
                  <span className="flex flex-col items-start gap-1">
                    <span className="font-semibold">
                      Pakai packaging
                    </span>
                    <span className="text-muted-foreground text-xs font-normal">
                      Kurangi stok dan akui HPP bahan
                      packing
                    </span>
                  </span>
                </ToggleGroupItem>
              </ToggleGroup>
            </CardContent>
            <CardFooter className="bg-muted/30 flex-col items-start gap-3 border-t">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Check className="text-success" />
                Double-entry enforced
              </div>
              <p className="text-muted-foreground text-xs leading-5">
                Setiap submit akan membuat event
                operasional, journal entry, dan audit trail
                dalam satu alur.
              </p>
            </CardFooter>
          </Card>

          <Card className="border-primary/20 shadow-primary/5 overflow-hidden shadow-lg">
            <CardHeader className="border-b">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardDescription className="text-primary tracking-[0.18em] uppercase">
                    {flow === 'expense'
                      ? 'Expense journal'
                      : flow === 'purchase'
                        ? 'Inventory intake'
                        : 'Packaging usage'}
                  </CardDescription>
                  <CardTitle className="mt-2 text-2xl">
                    {flow === 'expense'
                      ? 'Apa yang dibayar atau menjadi kewajiban?'
                      : flow === 'purchase'
                        ? 'Barang apa yang masuk ke stok?'
                        : 'Berapa bahan packing yang dipakai?'}
                  </CardTitle>
                </div>
                <Badge variant="secondary">
                  {flow === 'consumption'
                    ? 'Weighted average'
                    : 'Auto journal'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              {flow === 'expense' ? (
                <ExpenseForm
                  form={{
                    ...expenseForm,
                    expense_account:
                      expenseForm.expense_account ||
                      defaultExpenseAccount,
                  }}
                  accounts={expenseAccounts}
                  paymentAccounts={paymentAccounts}
                  disabled={!isReady || isSubmitting}
                  onChange={setExpenseForm}
                  onSubmit={submitFlow}
                  isSubmitting={isSubmitting}
                />
              ) : flow === 'purchase' ? (
                <PurchaseForm
                  form={{
                    ...purchaseForm,
                    inventory_item:
                      purchaseForm.inventory_item ||
                      defaultPurchaseItem,
                    location:
                      purchaseForm.location ||
                      defaultLocation,
                  }}
                  items={bootstrap?.inventoryItems ?? []}
                  locations={bootstrap?.locations ?? []}
                  paymentAccounts={paymentAccounts}
                  disabled={!isReady || isSubmitting}
                  onChange={setPurchaseForm}
                  onSubmit={submitFlow}
                  isSubmitting={isSubmitting}
                />
              ) : (
                <ConsumptionForm
                  form={{
                    ...consumptionForm,
                    inventory_item:
                      consumptionForm.inventory_item ||
                      defaultPackagingItem,
                    location:
                      consumptionForm.location ||
                      defaultLocation,
                  }}
                  items={packagingItems}
                  locations={bootstrap?.locations ?? []}
                  disabled={!isReady || isSubmitting}
                  onChange={setConsumptionForm}
                  onSubmit={submitFlow}
                  isSubmitting={isSubmitting}
                />
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <LedgerHint
            icon={CircleDollarSign}
            title="Cash stays honest"
            description="Payment account atau utang usaha menjadi sisi credit yang eksplisit."
          />
          <LedgerHint
            icon={Package}
            title="Stok punya jejak"
            description="Pembelian dan pemakaian tersimpan sebagai movement, bukan angka statis."
          />
          <LedgerHint
            icon={WalletCards}
            title="Ledger tetap turunan"
            description="Semua transaksi masuk melalui journal service dan dapat diaudit kembali."
          />
        </section>

        <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
          <span>Accounting desk</span>
          <Separator
            orientation="vertical"
            className="h-3"
          />
          <span>Organization-scoped</span>
          <Separator
            orientation="vertical"
            className="h-3"
          />
          <span>Phase 6A</span>
          <ArrowUpRight />
        </div>
      </div>
    </main>
  );
}

function ExpenseForm({
  form,
  accounts,
  paymentAccounts,
  disabled,
  onChange,
  onSubmit,
  isSubmitting,
}: {
  form: {
    amount: string;
    expense_account: string;
    payment_account: string;
    expense_date: string;
    vendor_name: string;
    description: string;
  };
  accounts: AccountOption[];
  paymentAccounts: AccountOption[];
  disabled: boolean;
  onChange: React.Dispatch<
    React.SetStateAction<{
      amount: string;
      expense_account: string;
      payment_account: string;
      expense_date: string;
      vendor_name: string;
      description: string;
    }>
  >;
  onSubmit: (
    event: React.FormEvent<HTMLFormElement>
  ) => void;
  isSubmitting: boolean;
}) {
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={onSubmit}
    >
      <FieldGroup>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="expense-amount">
              Nominal
            </FieldLabel>
            <Input
              id="expense-amount"
              type="number"
              min="1"
              step="1"
              required
              placeholder="250000"
              value={form.amount}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  amount: event.target.value,
                }))
              }
              disabled={disabled}
            />
            <FieldDescription>
              IDR ·{' '}
              {form.amount
                ? formatIDR(Number(form.amount))
                : 'Masukkan nominal'}
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="expense-date">
              Tanggal
            </FieldLabel>
            <Input
              id="expense-date"
              type="date"
              required
              value={form.expense_date}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  expense_date: event.target.value,
                }))
              }
              disabled={disabled}
            />
          </Field>
        </div>
        <AccountSelect
          id="expense-account"
          label="Expense account"
          placeholder="Pilih beban"
          value={form.expense_account}
          options={accounts}
          disabled={disabled}
          onChange={(value) =>
            onChange((current) => ({
              ...current,
              expense_account: value,
            }))
          }
        />
        <AccountSelect
          id="payment-account"
          label="Dibayar dari / offset"
          placeholder="Pilih kas, bank, atau utang"
          value={form.payment_account}
          options={paymentAccounts}
          disabled={disabled}
          onChange={(value) =>
            onChange((current) => ({
              ...current,
              payment_account: value,
            }))
          }
          description="Kosongkan untuk memakai Utang Usaha 2100."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="expense-vendor">
              Vendor / sumber
            </FieldLabel>
            <Input
              id="expense-vendor"
              placeholder="Toko bahan packing"
              value={form.vendor_name}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  vendor_name: event.target.value,
                }))
              }
              disabled={disabled}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="expense-description">
              Keterangan
            </FieldLabel>
            <Input
              id="expense-description"
              required
              placeholder="Beli bubble wrap 1 roll"
              value={form.description}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              disabled={disabled}
            />
          </Field>
        </div>
      </FieldGroup>
      <SubmitButton
        disabled={disabled}
        isSubmitting={isSubmitting}
        label="Post expense"
      />
    </form>
  );
}

function PurchaseForm({
  form,
  items,
  locations,
  paymentAccounts,
  disabled,
  onChange,
  onSubmit,
  isSubmitting,
}: {
  form: {
    inventory_item: string;
    location: string;
    quantity: string;
    unit_cost: string;
    offset_account: string;
    occurred_at: string;
    reference: string;
  };
  items: InventoryItemOption[];
  locations: LocationOption[];
  paymentAccounts: AccountOption[];
  disabled: boolean;
  onChange: React.Dispatch<
    React.SetStateAction<{
      inventory_item: string;
      location: string;
      quantity: string;
      unit_cost: string;
      offset_account: string;
      occurred_at: string;
      reference: string;
    }>
  >;
  onSubmit: (
    event: React.FormEvent<HTMLFormElement>
  ) => void;
  isSubmitting: boolean;
}) {
  const total =
    Number(form.quantity || 0) *
    Number(form.unit_cost || 0);
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={onSubmit}
    >
      <FieldGroup>
        <div className="grid gap-5 sm:grid-cols-2">
          <OptionSelect
            id="purchase-item"
            label="Inventory item"
            placeholder="Pilih item"
            value={form.inventory_item}
            options={items.map((item) => ({
              value: item._id,
              label: `${item.sku} · ${item.name}`,
              hint: item.item_type,
            }))}
            disabled={disabled}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                inventory_item: value,
              }))
            }
          />
          <OptionSelect
            id="purchase-location"
            label="Lokasi stok"
            placeholder="Pilih lokasi"
            value={form.location}
            options={locations.map((location) => ({
              value: location._id,
              label: `${location.code} · ${location.name}`,
              hint: location.type,
            }))}
            disabled={disabled}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                location: value,
              }))
            }
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="purchase-quantity">
              Quantity
            </FieldLabel>
            <Input
              id="purchase-quantity"
              type="number"
              min="1"
              step="1"
              required
              value={form.quantity}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  quantity: event.target.value,
                }))
              }
              disabled={disabled}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="purchase-unit-cost">
              Unit cost
            </FieldLabel>
            <Input
              id="purchase-unit-cost"
              type="number"
              min="1"
              step="1"
              required
              placeholder="45000"
              value={form.unit_cost}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  unit_cost: event.target.value,
                }))
              }
              disabled={disabled}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="purchase-date">
              Tanggal masuk
            </FieldLabel>
            <Input
              id="purchase-date"
              type="date"
              required
              value={form.occurred_at}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  occurred_at: event.target.value,
                }))
              }
              disabled={disabled}
            />
          </Field>
        </div>
        <AccountSelect
          id="purchase-offset-account"
          label="Dibayar dari / offset"
          placeholder="Pilih kas, bank, atau utang"
          value={form.offset_account}
          options={paymentAccounts}
          disabled={disabled}
          onChange={(value) =>
            onChange((current) => ({
              ...current,
              offset_account: value,
            }))
          }
          description="Kosongkan untuk memakai Utang Usaha 2100."
        />
        <Field>
          <FieldLabel htmlFor="purchase-reference">
            Referensi
          </FieldLabel>
          <Textarea
            id="purchase-reference"
            placeholder="Supplier, nomor invoice, atau catatan penerimaan"
            value={form.reference}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                reference: event.target.value,
              }))
            }
            disabled={disabled}
          />
          <FieldDescription>
            Total purchase: {formatIDR(total)}
          </FieldDescription>
        </Field>
      </FieldGroup>
      <SubmitButton
        disabled={disabled}
        isSubmitting={isSubmitting}
        label="Post purchase"
      />
    </form>
  );
}

function ConsumptionForm({
  form,
  items,
  locations,
  disabled,
  onChange,
  onSubmit,
  isSubmitting,
}: {
  form: {
    inventory_item: string;
    location: string;
    quantity: string;
    occurred_at: string;
    reference: string;
  };
  items: InventoryItemOption[];
  locations: LocationOption[];
  disabled: boolean;
  onChange: React.Dispatch<
    React.SetStateAction<{
      inventory_item: string;
      location: string;
      quantity: string;
      occurred_at: string;
      reference: string;
    }>
  >;
  onSubmit: (
    event: React.FormEvent<HTMLFormElement>
  ) => void;
  isSubmitting: boolean;
}) {
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={onSubmit}
    >
      <Alert className="bg-primary/5 border-primary/20">
        <Boxes />
        <AlertTitle>Cost dihitung otomatis</AlertTitle>
        <AlertDescription>
          Sistem memakai weighted-average dari purchase yang
          sudah posted pada lokasi stok ini, lalu membuat
          journal HPP packaging.
        </AlertDescription>
      </Alert>
      <FieldGroup>
        <OptionSelect
          id="consumption-item"
          label="Bahan packaging"
          placeholder="Pilih bahan"
          value={form.inventory_item}
          options={items.map((item) => ({
            value: item._id,
            label: `${item.sku} · ${item.name}`,
            hint: item.unit,
          }))}
          disabled={disabled}
          onChange={(value) =>
            onChange((current) => ({
              ...current,
              inventory_item: value,
            }))
          }
        />
        <div className="grid gap-5 sm:grid-cols-3">
          <OptionSelect
            id="consumption-location"
            label="Lokasi stok"
            placeholder="Pilih lokasi"
            value={form.location}
            options={locations.map((location) => ({
              value: location._id,
              label: `${location.code} · ${location.name}`,
              hint: location.type,
            }))}
            disabled={disabled}
            onChange={(value) =>
              onChange((current) => ({
                ...current,
                location: value,
              }))
            }
          />
          <Field>
            <FieldLabel htmlFor="consumption-quantity">
              Quantity
            </FieldLabel>
            <Input
              id="consumption-quantity"
              type="number"
              min="1"
              step="1"
              required
              value={form.quantity}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  quantity: event.target.value,
                }))
              }
              disabled={disabled}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="consumption-date">
              Tanggal pakai
            </FieldLabel>
            <Input
              id="consumption-date"
              type="date"
              required
              value={form.occurred_at}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  occurred_at: event.target.value,
                }))
              }
              disabled={disabled}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="consumption-reference">
            Dipakai untuk
          </FieldLabel>
          <Textarea
            id="consumption-reference"
            placeholder="Contoh: packing order batch pagi"
            value={form.reference}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                reference: event.target.value,
              }))
            }
            disabled={disabled}
          />
        </Field>
      </FieldGroup>
      <SubmitButton
        disabled={disabled}
        isSubmitting={isSubmitting}
        label="Post consumption"
      />
    </form>
  );
}

function AccountSelect({
  id,
  label,
  placeholder,
  value,
  options,
  disabled,
  onChange,
  description,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  options: AccountOption[];
  disabled: boolean;
  onChange: (value: string) => void;
  description?: string;
}) {
  return (
    <OptionSelect
      id={id}
      label={label}
      placeholder={placeholder}
      value={value}
      options={options.map((account) => ({
        value: account._id,
        label: `${account.code} · ${account.name}`,
        hint: account.type,
      }))}
      disabled={disabled}
      onChange={onChange}
      description={description}
    />
  );
}

function OptionSelect({
  id,
  label,
  placeholder,
  value,
  options,
  disabled,
  onChange,
  description,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  options: Array<{
    value: string;
    label: string;
    hint?: string;
  }>;
  disabled: boolean;
  onChange: (value: string) => void;
  description?: string;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        value={value || null}
        onValueChange={(next) => onChange(next || '')}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          className="w-full"
          aria-label={label}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
              >
                <span>{option.label}</span>
                {option.hint ? (
                  <span className="text-muted-foreground text-xs capitalize">
                    {option.hint.replaceAll('_', ' ')}
                  </span>
                ) : null}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {description ? (
        <FieldDescription>{description}</FieldDescription>
      ) : null}
    </Field>
  );
}

function SubmitButton({
  label,
  disabled,
  isSubmitting,
}: {
  label: string;
  disabled: boolean;
  isSubmitting: boolean;
}) {
  return (
    <Button
      type="submit"
      className="w-full sm:w-fit"
      disabled={disabled}
    >
      {isSubmitting ? (
        <LoaderCircle
          className="animate-spin"
          data-icon="inline-start"
        />
      ) : (
        <Check data-icon="inline-start" />
      )}
      {isSubmitting ? 'Posting…' : label}
    </Button>
  );
}

function LedgerHint({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Card className="bg-card/70">
      <CardContent className="flex gap-4 p-5">
        <div className="bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-xl">
          <Icon />
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-semibold">{title}</p>
          <p className="text-muted-foreground text-sm leading-6">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
