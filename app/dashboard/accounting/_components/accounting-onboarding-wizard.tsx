'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@tanstack/react-form';
import { toast } from 'sonner';
import {
  Add01Icon,
  ArrowLeft02Icon,
  ArrowRight02Icon,
  BankIcon,
  Building03Icon,
  Calendar03Icon,
  Chart03Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  FileEditIcon,
  InformationCircleIcon,
  Money01Icon,
  Package02Icon,
  SecurityCheckIcon,
  ShoppingCart01Icon,
  SparklesIcon,
  Wallet02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@/components/icons/hugeicons-icon';
import { useAppForm } from '@/components/form/form.hook';
import { ORDER_PLATFORMS } from '@/constant/order-platform';
import { TIMEZONES } from '@/constant/timezone';
import {
  Stepper,
  type StepperStep,
} from '@/components/ui/stepper';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils/ui';

const steps: StepperStep[] = [
  {
    title: 'Mulai',
    description: 'Cutover accounting',
    icon: Calendar03Icon,
  },
  {
    title: 'Kesiapan data',
    description: 'Product dan inventory',
    icon: Package02Icon,
  },
  {
    title: 'Struktur akun',
    description: 'CoA dan rekening',
    icon: Chart03Icon,
  },
  {
    title: 'Saldo awal',
    description: 'Opening journal',
    icon: Wallet02Icon,
  },
  {
    title: 'Review',
    description: 'Konfirmasi dan aktifkan',
    icon: SecurityCheckIcon,
  },
];

type AccountingStatus =
  | 'not_started'
  | 'in_progress'
  | 'active';

type AccountMappingValues = {
  sales_revenue: string;
  marketplace_balance: string;
  merchandise_inventory: string;
  merchandise_cogs: string;
  opening_balance_equity: string;
  expense_payable: string;
  marketplace_receivables: Record<string, string>;
  marketplace_balances: Record<string, string>;
  marketplace_fee_accounts: Record<string, string>;
};

type BankAccountFormValue = {
  code: string;
  name: string;
  institution: string;
  account_last4: string;
  account_holder: string;
  balance: string;
};

type InventoryLineFormValue = {
  candidate_key: string;
  product: string;
  variant_id: string;
  sku: string;
  name: string;
  unit: string;
  quantity: string;
  unit_cost: string;
  location: string;
  store: string;
  platform: string;
};

type OpeningAdjustmentFormValue = {
  account: string;
  debit: string;
  credit: string;
  description: string;
  counterparty: string;
  due_date: string;
};

type OnboardingFormValues = {
  cutover_date: string;
  calendar_timezone: string;
  inventory_mode: 'detailed' | 'aggregate';
  aggregate_inventory_value: string;
  description: string;
  bank_accounts: BankAccountFormValue[];
  inventory_lines: InventoryLineFormValue[];
  opening_balance_adjustments: OpeningAdjustmentFormValue[];
  account_mappings: AccountMappingValues;
  new_bank_name: string;
  new_bank_institution: string;
  new_bank_last4: string;
  new_bank_holder: string;
  new_bank_balance: string;
  confirmation: boolean;
};

type AccountRecord = {
  _id: string;
  code: string;
  name: string;
  type: string;
  subtype?: string;
  is_postable: boolean;
  is_active: boolean;
  account_metadata?: {
    institution?: string;
    account_last4?: string;
    account_holder?: string;
    provider?: string;
  };
};

type StoreRecord = {
  _id: string;
  name: string;
  code?: string;
  timezone?: string;
};

type LocationRecord = {
  _id: string;
  name: string;
  code: string;
};

type BootstrapData = {
  accounts: AccountRecord[];
  locations: LocationRecord[];
};

type OnboardingState = {
  status: AccountingStatus;
  onboarding_version: number;
  calendar_timezone?: string;
  cutover_date?: string;
  account_mappings?: Partial<AccountMappingValues>;
};

type OnboardingStatusResponse = {
  organization_id: string;
  state: OnboardingState;
  stores: StoreRecord[];
  can_start: boolean;
  can_finalize: boolean;
  onboarding_locked: boolean;
};

type InventoryCandidate = {
  product_id: string;
  store_id: string;
  platform?: string;
  product_external_id?: string;
  variant_id?: string;
  sku?: string;
  name: string;
  suggested_unit_cost?: number;
  default_quantity: number;
  mapping_id?: string;
  inventory_item_id?: string;
  mapped: boolean;
};

type InventoryPreview = {
  state: OnboardingState;
  offset: number;
  next_offset?: number;
  has_more: boolean;
  product_count: number;
  total_product_count: number;
  candidate_count: number;
  mapped_count: number;
  unmapped_count: number;
  candidates: InventoryCandidate[];
};

type OpeningPreview = {
  state: OnboardingState;
  cutover_date: string;
  period: string;
  calendar_timezone: string;
  inventory: {
    detail_value: number;
    aggregate_value: number;
    total_value: number;
    line_count: number;
  };
  bank_accounts: {
    count: number;
    total_balance: number;
  };
  opening_balance: {
    total_assets: number;
    adjustment_debit: number;
    adjustment_credit: number;
    suggested_equity_credit: number;
    suggested_equity_debit: number;
    provided_debit: number;
    provided_credit: number;
    will_create_journal: boolean;
  };
  blockers: string[];
  warnings: string[];
  can_finalize: boolean;
};

type ApiFailure = Error & {
  code?: string;
  status?: number;
};

type CompletionResult = {
  period?: { period_key?: string };
};

const defaultMappings: AccountMappingValues = {
  sales_revenue: '',
  marketplace_balance: '',
  merchandise_inventory: '',
  merchandise_cogs: '',
  opening_balance_equity: '',
  expense_payable: '',
  marketplace_receivables: Object.fromEntries(
    Object.values(ORDER_PLATFORMS).map((platform) => [
      platform.value,
      '',
    ])
  ),
  marketplace_balances: Object.fromEntries(
    Object.values(ORDER_PLATFORMS).map((platform) => [
      platform.value,
      '',
    ])
  ),
  marketplace_fee_accounts: Object.fromEntries(
    Object.values(ORDER_PLATFORMS).map((platform) => [
      platform.value,
      '',
    ])
  ),
};

const getDefaultCutoverDate = () => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    '01',
  ].join('-');
};

const defaultValues: OnboardingFormValues = {
  cutover_date: getDefaultCutoverDate(),
  calendar_timezone: 'Asia/Jakarta',
  inventory_mode: 'detailed',
  aggregate_inventory_value: '',
  description: 'Saldo awal accounting',
  bank_accounts: [],
  inventory_lines: [],
  opening_balance_adjustments: [],
  account_mappings: defaultMappings,
  new_bank_name: '',
  new_bank_institution: '',
  new_bank_last4: '',
  new_bank_holder: '',
  new_bank_balance: '',
  confirmation: false,
};

const ONBOARDING_DRAFT_VERSION = 1;
type OnboardingDraftValues = Pick<
  OnboardingFormValues,
  | 'cutover_date'
  | 'calendar_timezone'
  | 'inventory_mode'
  | 'aggregate_inventory_value'
  | 'description'
  | 'bank_accounts'
  | 'inventory_lines'
  | 'opening_balance_adjustments'
  | 'account_mappings'
>;

type StoredOnboardingDraft = {
  version: number;
  saved_at: string;
  values: OnboardingDraftValues;
};

const getOnboardingDraftKey = (organizationId: string) =>
  `pasaria:accounting-onboarding:${organizationId}:draft`;

const getOnboardingDraftValues = (
  values: OnboardingFormValues
): OnboardingDraftValues => ({
  cutover_date: values.cutover_date,
  calendar_timezone: values.calendar_timezone,
  inventory_mode: values.inventory_mode,
  aggregate_inventory_value:
    values.aggregate_inventory_value,
  description: values.description,
  bank_accounts: values.bank_accounts,
  inventory_lines: values.inventory_lines,
  opening_balance_adjustments:
    values.opening_balance_adjustments,
  account_mappings: values.account_mappings,
});

const readOnboardingDraft = (organizationId: string) => {
  try {
    const raw = window.localStorage.getItem(
      getOnboardingDraftKey(organizationId)
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredOnboardingDraft;
    const values =
      parsed.values as Partial<OnboardingDraftValues>;
    if (
      parsed.version !== ONBOARDING_DRAFT_VERSION ||
      !values ||
      typeof values !== 'object' ||
      typeof values.cutover_date !== 'string' ||
      typeof values.calendar_timezone !== 'string' ||
      (values.inventory_mode !== 'detailed' &&
        values.inventory_mode !== 'aggregate') ||
      typeof values.aggregate_inventory_value !==
        'string' ||
      typeof values.description !== 'string' ||
      !Array.isArray(values.bank_accounts) ||
      !Array.isArray(values.inventory_lines) ||
      !Array.isArray(values.opening_balance_adjustments) ||
      !values.account_mappings ||
      typeof values.account_mappings !== 'object'
    ) {
      return null;
    }
    return values as OnboardingDraftValues;
  } catch {
    return null;
  }
};

const clearOnboardingDraft = (organizationId: string) => {
  try {
    window.localStorage.removeItem(
      getOnboardingDraftKey(organizationId)
    );
  } catch {
    // Storage may be unavailable in private browsing contexts.
  }
};

const parseMoney = (value: unknown) => {
  const parsed = Number(
    String(value ?? '')
      .replace(/[^\d-]/g, '')
      .trim()
  );
  return Number.isFinite(parsed) && parsed >= 0
    ? Math.trunc(parsed)
    : 0;
};

const formatIDR = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0);

const toDateInput = (value?: string) =>
  value ? value.slice(0, 10) : getDefaultCutoverDate();

const candidateKey = (candidate: InventoryCandidate) =>
  candidate.product_id +
  ':' +
  (candidate.variant_id || '__product__');

const accountLabel = (account: AccountRecord) =>
  account.code +
  ' · ' +
  account.name +
  (account.account_metadata?.account_last4
    ? ' •••• ' + account.account_metadata.account_last4
    : '');

async function requestJson<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    cache: 'no-store',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const payload = (await response
    .json()
    .catch(() => null)) as {
    success?: boolean;
    data?: T;
    error?: { code?: string; message?: string };
  } | null;

  if (!response.ok || !payload?.success) {
    const failure = new Error(
      payload?.error?.message ||
        'Permintaan onboarding gagal.'
    ) as ApiFailure;
    failure.code = payload?.error?.code;
    failure.status = response.status;
    throw failure;
  }

  return payload.data as T;
}

function IconTile({
  icon,
  tone = 'primary',
}: {
  icon: typeof Calendar03Icon;
  tone?: 'primary' | 'muted';
}) {
  return (
    <span
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-xl',
        tone === 'primary'
          ? 'bg-primary/12 text-primary'
          : 'bg-muted text-muted-foreground'
      )}
    >
      <HugeiconsIcon icon={icon} size={20} />
    </span>
  );
}

function MetricCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Calendar03Icon;
}) {
  return (
    <Card size="sm" className="bg-background/70">
      <CardContent className="flex items-start gap-3 p-4">
        <IconTile icon={icon} tone="muted" />
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {label}
          </p>
          <p className="mt-1 text-xl font-semibold tracking-tight">
            {value}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {note}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
        {eyebrow}
      </p>
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      <p className="text-muted-foreground max-w-2xl text-sm leading-6">
        {description}
      </p>
    </div>
  );
}

export default function AccountingOnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingPreview, setIsRefreshingPreview] =
    useState(false);
  const [
    isLoadingInventoryPreview,
    setIsLoadingInventoryPreview,
  ] = useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] =
    useState(false);
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] =
    useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);
  const [onboarding, setOnboarding] =
    useState<OnboardingStatusResponse | null>(null);
  const [bootstrap, setBootstrap] =
    useState<BootstrapData | null>(null);
  const [inventoryPreview, setInventoryPreview] =
    useState<InventoryPreview | null>(null);
  const [openingPreviewResponse, setOpeningPreview] =
    useState<OpeningPreview | null>(null);
  const [
    openingPreviewFingerprint,
    setOpeningPreviewFingerprint,
  ] = useState<string | null>(null);
  const [completion, setCompletion] =
    useState<CompletionResult | null>(null);
  const [isDraftHydrated, setIsDraftHydrated] =
    useState(false);

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      if (!value.confirmation) {
        setCurrentStep(4);
        toast.error(
          'Konfirmasi review diperlukan sebelum accounting diaktifkan.'
        );
        return;
      }
      setIsFinalizing(true);
      setErrorMessage(null);
      try {
        await ensureStarted();
        const preview = await refreshOpeningPreview(value);
        if (!preview.can_finalize) {
          setCurrentStep(3);
          toast.error(
            'Perbaiki blocker saldo awal sebelum finalisasi.'
          );
          return;
        }
        const result = await requestJson<CompletionResult>(
          '/api/v1/dashboard/accounting/onboarding/finalize',
          {
            method: 'POST',
            body: JSON.stringify(
              buildFinalizePayload(value)
            ),
          }
        );
        setCompletion(result);
        setIsComplete(true);
        if (onboarding?.organization_id) {
          clearOnboardingDraft(onboarding.organization_id);
        }
        toast.success(
          'Accounting berhasil diaktifkan untuk organization ini.'
        );
      } catch (error) {
        handleApiError(error);
      } finally {
        setIsFinalizing(false);
      }
    },
  });

  const formValues = useStore(
    form.store,
    (state) => state.values as OnboardingFormValues
  );
  const persistedFormFingerprint = useMemo(
    () =>
      JSON.stringify(getOnboardingDraftValues(formValues)),
    [formValues]
  );
  const openingPreview = useMemo(
    () =>
      openingPreviewResponse &&
      openingPreviewFingerprint === persistedFormFingerprint
        ? openingPreviewResponse
        : null,
    [
      openingPreviewFingerprint,
      openingPreviewResponse,
      persistedFormFingerprint,
    ]
  );
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const postableAccounts = useMemo(
    () =>
      bootstrap?.accounts.filter(
        (account) =>
          account.is_active && account.is_postable
      ) ?? [],
    [bootstrap]
  );
  const locationItems = useMemo(
    () =>
      (bootstrap?.locations ?? []).map((location) => ({
        label: location.code + ' · ' + location.name,
        value: location._id,
      })),
    [bootstrap]
  );
  const accountItems = useMemo(
    () =>
      postableAccounts.map((account) => ({
        label: accountLabel(account),
        value: account._id,
      })),
    [postableAccounts]
  );
  const assetAccountItems = useMemo(
    () =>
      accountItems.filter((item) => {
        const account = postableAccounts.find(
          (candidate) => candidate._id === item.value
        );
        return account?.type === 'asset';
      }),
    [accountItems, postableAccounts]
  );
  const equityAccountItems = useMemo(
    () =>
      accountItems.filter((item) => {
        const account = postableAccounts.find(
          (candidate) => candidate._id === item.value
        );
        return account?.type === 'equity';
      }),
    [accountItems, postableAccounts]
  );
  const expenseAccountItems = useMemo(
    () =>
      accountItems.filter((item) => {
        const account = postableAccounts.find(
          (candidate) => candidate._id === item.value
        );
        return (
          account?.type === 'expense' ||
          account?.type === 'other_expense' ||
          account?.type === 'cost_of_sales'
        );
      }),
    [accountItems, postableAccounts]
  );
  const liabilityAccountItems = useMemo(
    () =>
      accountItems.filter((item) => {
        const account = postableAccounts.find(
          (candidate) => candidate._id === item.value
        );
        return account?.type === 'liability';
      }),
    [accountItems, postableAccounts]
  );
  const openingBalanceAccountItems = useMemo(
    () =>
      accountItems.filter((item) => {
        const account = postableAccounts.find(
          (candidate) => candidate._id === item.value
        );
        return (
          account?.type === 'asset' ||
          account?.type === 'liability' ||
          account?.type === 'equity'
        );
      }),
    [accountItems, postableAccounts]
  );
  const revenueAccountItems = useMemo(
    () =>
      accountItems.filter((item) => {
        const account = postableAccounts.find(
          (candidate) => candidate._id === item.value
        );
        return (
          account?.type === 'revenue' ||
          account?.type === 'other_revenue'
        );
      }),
    [accountItems, postableAccounts]
  );

  const mergeAccountMappings = (
    mappings?: Partial<AccountMappingValues>
  ): AccountMappingValues => ({
    ...defaultMappings,
    ...(mappings || {}),
    marketplace_receivables: {
      ...defaultMappings.marketplace_receivables,
      ...(mappings?.marketplace_receivables || {}),
    },
    marketplace_balances: {
      ...defaultMappings.marketplace_balances,
      ...(mappings?.marketplace_balances || {}),
    },
    marketplace_fee_accounts: {
      ...defaultMappings.marketplace_fee_accounts,
      ...(mappings?.marketplace_fee_accounts || {}),
    },
  });

  function handleApiError(error: unknown) {
    const failure = error as ApiFailure;
    if (
      failure.code === 'ONBOARDING_ALREADY_COMPLETED' ||
      failure.status === 409
    ) {
      router.replace('/dashboard/accounting');
      return;
    }
    const message =
      error instanceof Error
        ? error.message
        : 'Gagal memproses accounting onboarding.';
    setErrorMessage(message);
    toast.error(message);
  }

  function buildFinalizePayload(
    values: OnboardingFormValues
  ) {
    const accountMappingEntries: Array<[string, unknown]> =
      [];
    for (const [key, value] of Object.entries(
      values.account_mappings
    )) {
      if (value && typeof value === 'object') {
        const normalized = Object.fromEntries(
          Object.entries(value).filter(([, item]) =>
            Boolean(item)
          )
        );
        if (Object.keys(normalized).length > 0) {
          accountMappingEntries.push([key, normalized]);
        }
        continue;
      }
      if (value) accountMappingEntries.push([key, value]);
    }
    const accountMappings = Object.fromEntries(
      accountMappingEntries
    ) as Partial<AccountMappingValues>;
    const inventoryLines =
      values.inventory_mode === 'detailed'
        ? values.inventory_lines.map((line) => ({
            product: line.product || undefined,
            variant_id: line.variant_id || undefined,
            sku: line.sku || undefined,
            name: line.name || undefined,
            unit: line.unit || 'unit',
            quantity: parseMoney(line.quantity),
            unit_cost:
              parseMoney(line.unit_cost) || undefined,
            location: line.location || undefined,
            store: line.store || undefined,
            platform: line.platform || undefined,
          }))
        : [];
    const bankAccounts = values.bank_accounts
      .filter((account) => account.name.trim())
      .map((account) => ({
        code: account.code.trim() || undefined,
        name: account.name.trim(),
        institution:
          account.institution.trim() || undefined,
        account_last4:
          account.account_last4.trim() || undefined,
        account_holder:
          account.account_holder.trim() || undefined,
        balance: parseMoney(account.balance),
      }));
    const openingBalanceAdjustments =
      values.opening_balance_adjustments
        .filter((line) => line.account)
        .map((line) => ({
          account: line.account,
          debit: parseMoney(line.debit),
          credit: parseMoney(line.credit),
          ...(line.description.trim()
            ? { description: line.description.trim() }
            : {}),
          ...(line.counterparty.trim()
            ? { counterparty: line.counterparty.trim() }
            : {}),
          ...(line.due_date
            ? { due_date: line.due_date }
            : {}),
        }))
        .filter(
          (line) => line.debit > 0 || line.credit > 0
        );
    const payload = {
      cutover_date: values.cutover_date,
      calendar_timezone:
        values.calendar_timezone || 'Asia/Jakarta',
      description:
        values.description.trim() ||
        'Saldo awal accounting',
      inventory_mode: values.inventory_mode,
      bank_accounts: bankAccounts,
      inventory_lines: inventoryLines,
      opening_balance_adjustments:
        openingBalanceAdjustments,
      account_mappings: accountMappings,
    } as Record<string, unknown>;
    if (values.inventory_mode === 'aggregate') {
      const aggregateValue = parseMoney(
        values.aggregate_inventory_value
      );
      if (aggregateValue > 0) {
        payload.aggregate_inventory_value = aggregateValue;
      }
    }
    return payload;
  }

  async function loadBootstrap() {
    const next = await requestJson<BootstrapData>(
      '/api/v1/dashboard/accounting/bootstrap'
    );
    setBootstrap(next);
    return next;
  }

  async function prepareTechnicalSetup(
    values: OnboardingFormValues = form.state.values
  ) {
    await requestJson(
      '/api/v1/dashboard/accounting/setup',
      {
        method: 'POST',
        body: JSON.stringify({
          cutover_date: values.cutover_date,
          calendar_timezone:
            values.calendar_timezone || 'Asia/Jakarta',
        }),
      }
    );
    return loadBootstrap();
  }

  async function loadInventoryPreview(options?: {
    append?: boolean;
  }) {
    const append = options?.append ?? false;
    const offset = append
      ? (inventoryPreview?.next_offset ?? 0)
      : 0;
    setIsLoadingInventoryPreview(true);
    try {
      const query = new URLSearchParams({
        offset: String(offset),
        limit: '100',
      });
      const preview = await requestJson<InventoryPreview>(
        '/api/v1/dashboard/accounting/onboarding/inventory/preview?' +
          query.toString()
      );
      setInventoryPreview((current) =>
        append && current
          ? {
              ...preview,
              candidates: [
                ...current.candidates,
                ...preview.candidates,
              ],
              offset: current.offset,
              product_count:
                current.product_count +
                preview.product_count,
              candidate_count:
                current.candidate_count +
                preview.candidate_count,
              mapped_count:
                current.mapped_count + preview.mapped_count,
              unmapped_count:
                current.unmapped_count +
                preview.unmapped_count,
            }
          : preview
      );
      return preview;
    } finally {
      setIsLoadingInventoryPreview(false);
    }
  }

  async function refreshOpeningPreview(
    values: OnboardingFormValues = form.state.values
  ) {
    setIsRefreshingPreview(true);
    try {
      const preview = await requestJson<OpeningPreview>(
        '/api/v1/dashboard/accounting/onboarding/opening-balance/preview',
        {
          method: 'POST',
          body: JSON.stringify(
            buildFinalizePayload(values)
          ),
        }
      );
      setOpeningPreview(preview);
      setOpeningPreviewFingerprint(
        JSON.stringify(getOnboardingDraftValues(values))
      );
      return preview;
    } finally {
      setIsRefreshingPreview(false);
    }
  }

  async function ensureStarted() {
    let started = onboarding?.state;
    if (started?.status !== 'in_progress') {
      started = await requestJson<OnboardingState>(
        '/api/v1/dashboard/accounting/onboarding/start',
        { method: 'POST' }
      );
      setOnboarding((current) =>
        current
          ? {
              ...current,
              state: started as OnboardingState,
              can_start: false,
              can_finalize: true,
            }
          : current
      );
    }

    await prepareTechnicalSetup();
    await loadInventoryPreview();
    return started;
  }

  useEffect(() => {
    let mounted = true;
    async function loadInitial() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const status =
          await requestJson<OnboardingStatusResponse>(
            '/api/v1/dashboard/accounting/onboarding'
          );
        if (!mounted) return;
        setOnboarding(status);
        const timezone =
          status.state.calendar_timezone ||
          status.stores[0]?.timezone ||
          'Asia/Jakarta';
        form.setFieldValue('calendar_timezone', timezone);
        form.setFieldValue(
          'cutover_date',
          toDateInput(status.state.cutover_date)
        );
        form.setFieldValue(
          'account_mappings',
          mergeAccountMappings(
            status.state.account_mappings
          )
        );
        if (status.state.status === 'in_progress') {
          const draft = readOnboardingDraft(
            status.organization_id
          );
          if (draft) {
            form.setFieldValue(
              'cutover_date',
              draft.cutover_date
            );
            form.setFieldValue(
              'calendar_timezone',
              draft.calendar_timezone
            );
            form.setFieldValue(
              'inventory_mode',
              draft.inventory_mode
            );
            form.setFieldValue(
              'aggregate_inventory_value',
              draft.aggregate_inventory_value
            );
            form.setFieldValue(
              'description',
              draft.description
            );
            form.setFieldValue(
              'bank_accounts',
              draft.bank_accounts
            );
            form.setFieldValue(
              'inventory_lines',
              draft.inventory_lines
            );
            form.setFieldValue(
              'opening_balance_adjustments',
              draft.opening_balance_adjustments
            );
            form.setFieldValue(
              'account_mappings',
              mergeAccountMappings(draft.account_mappings)
            );
          }
          await prepareTechnicalSetup();
        }
        await loadBootstrap();
        if (status.state.status === 'in_progress') {
          await loadInventoryPreview();
        }
        setIsDraftHydrated(true);
      } catch (error) {
        if (mounted) handleApiError(error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    void loadInitial();
    return () => {
      mounted = false;
    };
    // The initial request intentionally runs once for the current organization.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      !isDraftHydrated ||
      isComplete ||
      onboarding?.state.status !== 'in_progress' ||
      !onboarding.organization_id
    ) {
      return;
    }
    try {
      const draft: StoredOnboardingDraft = {
        version: ONBOARDING_DRAFT_VERSION,
        saved_at: new Date().toISOString(),
        values: getOnboardingDraftValues(formValues),
      };
      window.localStorage.setItem(
        getOnboardingDraftKey(onboarding.organization_id),
        JSON.stringify(draft)
      );
    } catch {
      // Storage may be unavailable in private browsing contexts.
    }
  }, [
    formValues,
    isDraftHydrated,
    isComplete,
    onboarding?.organization_id,
    onboarding?.state.status,
    persistedFormFingerprint,
  ]);

  const toggleCandidate = (
    candidate: InventoryCandidate
  ) => {
    const key = candidateKey(candidate);
    const current =
      (form.getFieldValue(
        'inventory_lines'
      ) as InventoryLineFormValue[]) ?? [];
    const existingIndex = current.findIndex(
      (line) => line.candidate_key === key
    );
    if (existingIndex >= 0) {
      form.setFieldValue(
        'inventory_lines',
        current.filter(
          (_, index) => index !== existingIndex
        )
      );
      return;
    }
    form.setFieldValue('inventory_lines', [
      ...current,
      {
        candidate_key: key,
        product: candidate.product_id,
        variant_id: candidate.variant_id || '',
        sku: candidate.sku || '',
        name: candidate.name,
        unit: 'unit',
        quantity: String(candidate.default_quantity ?? 0),
        unit_cost: candidate.suggested_unit_cost
          ? String(candidate.suggested_unit_cost)
          : '',
        location: locationItems[0]?.value || '',
        store: candidate.store_id,
        platform: candidate.platform || '',
      },
    ]);
  };

  const addBankAccount = () => {
    const values = form.state.values;
    if (!values.new_bank_name.trim()) {
      toast.error('Nama rekening wajib diisi.');
      return;
    }
    form.pushFieldValue('bank_accounts', {
      code: '',
      name: values.new_bank_name.trim(),
      institution: values.new_bank_institution.trim(),
      account_last4: values.new_bank_last4.trim(),
      account_holder: values.new_bank_holder.trim(),
      balance: values.new_bank_balance || '0',
    });
    form.setFieldValue('new_bank_name', '');
    form.setFieldValue('new_bank_institution', '');
    form.setFieldValue('new_bank_last4', '');
    form.setFieldValue('new_bank_holder', '');
    form.setFieldValue('new_bank_balance', '');
    setIsAccountDialogOpen(false);
  };

  const addOpeningAdjustment = () => {
    form.pushFieldValue('opening_balance_adjustments', {
      account: liabilityAccountItems[0]?.value || '',
      debit: '0',
      credit: '0',
      description: '',
      counterparty: '',
      due_date: '',
    });
  };

  const goToStep = async (nextStep: number) => {
    if (nextStep === currentStep) return;
    try {
      if (nextStep > 0) {
        await ensureStarted();
      }
      if (nextStep >= 3) {
        const preview = await refreshOpeningPreview();
        if (nextStep === 4 && !preview.can_finalize) {
          setCurrentStep(3);
          toast.error(
            'Perbaiki blocker saldo awal sebelum finalisasi.'
          );
          return;
        }
      }
      setCurrentStep(nextStep);
    } catch (error) {
      handleApiError(error);
    }
  };

  const goNext = async () => {
    await goToStep(
      Math.min(currentStep + 1, steps.length - 1)
    );
  };

  const goPrevious = () => {
    setCurrentStep((value) => Math.max(value - 1, 0));
  };

  const currentInventoryLines =
    (formValues.inventory_lines as InventoryLineFormValue[]) ||
    [];
  const selectedInventoryCount =
    currentInventoryLines.length;
  const totalInventoryValue = currentInventoryLines.reduce(
    (sum, line) =>
      sum +
      parseMoney(line.quantity) *
        parseMoney(line.unit_cost),
    0
  );
  const totalBankValue = formValues.bank_accounts.reduce(
    (sum, account) => sum + parseMoney(account.balance),
    0
  );

  const renderAccountMapping = (
    name:
      | 'account_mappings.merchandise_inventory'
      | 'account_mappings.opening_balance_equity'
      | 'account_mappings.sales_revenue'
      | 'account_mappings.merchandise_cogs'
      | 'account_mappings.expense_payable'
      | 'account_mappings.marketplace_balance',
    label: string,
    items: Array<{ label: string; value: string }>,
    description: string
  ) => (
    <form.AppField name={name as never}>
      {(field) => (
        <field.SelectField
          label={label}
          description={description}
          placeholder={
            items.length
              ? 'Pilih account dari CoA'
              : 'CoA belum tersedia'
          }
          items={items}
          disabled={items.length === 0}
        />
      )}
    </form.AppField>
  );

  const renderStep = () => {
    if (currentStep === 0) {
      return (
        <div className="flex flex-col gap-8">
          <SectionHeading
            eyebrow="Langkah 01 · Titik mulai"
            title="Mulai dari tanggal yang jelas."
            description="Cutover adalah tanggal lokal saat accounting mulai berlaku. Backend akan menggunakan timezone accounting untuk menentukan period."
          />
          <Alert className="border-primary/20 bg-primary/5">
            <HugeiconsIcon icon={InformationCircleIcon} />
            <AlertTitle>
              Data lama tidak direkonstruksi otomatis
            </AlertTitle>
            <AlertDescription>
              Order sebelum cutover tetap tersedia. Jika
              nanti perlu dicatat, gunakan flow
              reconstruction terpisah.
            </AlertDescription>
          </Alert>
          <div className="grid gap-5 md:grid-cols-[1.15fr_0.85fr]">
            <Card className="bg-muted/30 border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTile icon={Calendar03Icon} />
                  Calendar accounting
                </CardTitle>
                <CardDescription>
                  Nilai default berasal dari timezone store
                  utama.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <form.AppField name="cutover_date">
                    {(field) => (
                      <field.TextField
                        label="Tanggal cutover"
                        type="date"
                        description="Tanggal lokal mulai pembukuan accounting."
                      />
                    )}
                  </form.AppField>
                  <form.AppField name="calendar_timezone">
                    {(field) => (
                      <field.SelectField
                        label="Timezone accounting"
                        description="Disimpan di organization dan dipakai untuk period."
                        items={Object.values(TIMEZONES)}
                      />
                    )}
                  </form.AppField>
                </FieldGroup>
              </CardContent>
            </Card>
            <div className="flex flex-col gap-3">
              <div className="bg-foreground text-background relative overflow-hidden rounded-2xl p-5">
                <div className="bg-primary/30 absolute -top-12 -right-10 size-32 rounded-full blur-2xl" />
                <div className="relative flex flex-col gap-8">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-background/65 text-xs font-medium tracking-[0.16em] uppercase">
                      Status backend
                    </span>
                    <Badge variant="secondary">
                      {onboarding?.state.status ===
                      'in_progress'
                        ? 'In progress'
                        : 'Not started'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-background/65 text-sm">
                      Cutover dipilih
                    </p>
                    <p className="mt-1 text-3xl font-semibold tracking-tight">
                      {formValues.cutover_date ||
                        'Belum diisi'}
                    </p>
                    <p className="text-background/65 mt-1 text-sm">
                      {formValues.calendar_timezone}
                    </p>
                  </div>
                </div>
              </div>
              <Card size="sm">
                <CardContent className="flex gap-3 p-4">
                  <IconTile
                    icon={Building03Icon}
                    tone="muted"
                  />
                  <div>
                    <p className="font-medium">
                      Satu ledger untuk organization
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm leading-5">
                      Store, platform, dan location tetap
                      menjadi dimensi transaksi.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    if (currentStep === 1) {
      const candidates = inventoryPreview?.candidates ?? [];
      return (
        <div className="flex flex-col gap-8">
          <SectionHeading
            eyebrow="Langkah 02 · Data readiness"
            title="Pilih data yang benar-benar dikelola."
            description="Candidate berasal dari product catalog organization. Product tidak otomatis dibuat menjadi inventory item."
          />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Product"
              value={String(
                inventoryPreview?.total_product_count ?? '—'
              )}
              note="product aktif"
              icon={ShoppingCart01Icon}
            />
            <MetricCard
              label="Candidate"
              value={String(
                inventoryPreview?.candidate_count ?? '—'
              )}
              note="product/variant"
              icon={Package02Icon}
            />
            <MetricCard
              label="Sudah mapping"
              value={String(
                inventoryPreview?.mapped_count ?? '—'
              )}
              note="dapat dipakai ulang"
              icon={CheckmarkCircle02Icon}
            />
            <MetricCard
              label="Belum mapping"
              value={String(
                inventoryPreview?.unmapped_count ?? '—'
              )}
              note="review eksplisit"
              icon={InformationCircleIcon}
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Inventory readiness</CardTitle>
              <CardDescription>
                Mode detail digunakan ketika quantity, cost,
                dan lokasi perlu dipakai untuk COGS. Mode
                aggregate hanya mencatat total asset
                inventory.
              </CardDescription>
              <CardAction>
                <Badge
                  variant={
                    inventoryPreview
                      ? 'outline'
                      : 'secondary'
                  }
                >
                  {inventoryPreview
                    ? 'Backend preview'
                    : 'Mulai onboarding untuk preview'}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <form.AppField name="inventory_mode">
                {(field) => (
                  <FieldSet>
                    <FieldLegend>
                      Mode inventory
                    </FieldLegend>
                    <ToggleGroup
                      value={[String(field.state.value)]}
                      onValueChange={(value: unknown) => {
                        const next = value as string[];
                        if (!next[0]) return;
                        field.handleChange(
                          next[0] as
                            | 'detailed'
                            | 'aggregate'
                        );
                        if (next[0] === 'aggregate') {
                          form.setFieldValue(
                            'inventory_lines',
                            []
                          );
                        }
                      }}
                      className="grid w-full gap-3 md:grid-cols-2"
                    >
                      <ToggleGroupItem
                        value="detailed"
                        variant="outline"
                        className="data-pressed:border-primary data-pressed:bg-primary/5 h-auto min-h-36 w-full justify-start rounded-2xl px-4 py-4 text-left"
                      >
                        <span className="bg-muted text-muted-foreground grid size-10 shrink-0 place-items-center rounded-xl">
                          <HugeiconsIcon
                            icon={Package02Icon}
                            size={20}
                          />
                        </span>
                        <span className="flex flex-col items-start gap-1">
                          <span className="font-medium">
                            Detail per item
                          </span>
                          <span className="text-muted-foreground text-sm leading-5 font-normal">
                            Quantity, cost, mapping, dan
                            location siap untuk COGS.
                          </span>
                        </span>
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="aggregate"
                        variant="outline"
                        className="data-pressed:border-primary data-pressed:bg-primary/5 h-auto min-h-36 w-full justify-start rounded-2xl px-4 py-4 text-left"
                      >
                        <span className="bg-muted text-muted-foreground grid size-10 shrink-0 place-items-center rounded-xl">
                          <HugeiconsIcon
                            icon={Money01Icon}
                            size={20}
                          />
                        </span>
                        <span className="flex flex-col items-start gap-1">
                          <span className="font-medium">
                            Aggregate
                          </span>
                          <span className="text-muted-foreground text-sm leading-5 font-normal">
                            Catat total asset dan lengkapi
                            detail inventory nanti.
                          </span>
                        </span>
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </FieldSet>
                )}
              </form.AppField>
            </CardContent>
            <CardFooter className="justify-between gap-3">
              <p className="text-muted-foreground text-xs">
                {selectedInventoryCount} candidate dipilih
                untuk dikirim saat finalisasi.
              </p>
              <Dialog
                open={isInventoryDialogOpen}
                onOpenChange={setIsInventoryDialogOpen}
              >
                <DialogTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!inventoryPreview}
                    />
                  }
                >
                  Tinjau candidate
                  <HugeiconsIcon
                    icon={ArrowRight02Icon}
                    data-icon="inline-end"
                  />
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      Candidate product catalog
                    </DialogTitle>
                    <DialogDescription>
                      Pilih hanya product/variant yang
                      benar-benar dikelola sebagai
                      inventory.
                    </DialogDescription>
                  </DialogHeader>
                  <FieldSet>
                    <FieldLegend variant="label">
                      Product dan variant
                    </FieldLegend>
                    <div className="flex max-h-[55vh] flex-col gap-3 overflow-y-auto pr-1">
                      {candidates.length === 0 ? (
                        <Alert>
                          <HugeiconsIcon
                            icon={InformationCircleIcon}
                          />
                          <AlertTitle>
                            Belum ada candidate
                          </AlertTitle>
                          <AlertDescription>
                            Pastikan product aktif tersedia
                            di organization.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        candidates.map((candidate) => {
                          const key =
                            candidateKey(candidate);
                          const selected =
                            currentInventoryLines.some(
                              (line) =>
                                line.candidate_key === key
                            );
                          return (
                            <Field
                              key={key}
                              orientation="horizontal"
                              className={cn(
                                'rounded-xl border p-3 transition-colors',
                                selected
                                  ? 'border-primary/40 bg-primary/5'
                                  : 'bg-background'
                              )}
                            >
                              <Checkbox
                                checked={selected}
                                onCheckedChange={() =>
                                  toggleCandidate(candidate)
                                }
                              />
                              <FieldContent>
                                <FieldLabel>
                                  {candidate.name}
                                </FieldLabel>
                                <FieldDescription>
                                  {candidate.sku ||
                                    candidate.product_external_id ||
                                    'Tanpa SKU'}
                                  {' · '}
                                  {candidate.mapped
                                    ? 'Sudah ter-mapping'
                                    : 'Belum ter-mapping'}
                                  {' · '}
                                  Cost suggestion:{' '}
                                  {candidate.suggested_unit_cost
                                    ? formatIDR(
                                        candidate.suggested_unit_cost
                                      )
                                    : 'Belum tersedia'}
                                </FieldDescription>
                              </FieldContent>
                            </Field>
                          );
                        })
                      )}
                    </div>
                  </FieldSet>
                  <DialogFooter className="flex-wrap justify-between gap-2">
                    {inventoryPreview?.has_more ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          void loadInventoryPreview({
                            append: true,
                          }).catch(handleApiError)
                        }
                        disabled={isLoadingInventoryPreview}
                      >
                        {isLoadingInventoryPreview ? (
                          <Spinner data-icon="inline-start" />
                        ) : null}
                        Muat candidate berikutnya
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        Semua product aktif sudah dimuat.
                      </span>
                    )}
                    <DialogClose
                      render={
                        <Button
                          type="button"
                          variant="outline"
                        />
                      }
                    >
                      Selesai meninjau
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
          <Card className="bg-muted/20">
            <CardHeader>
              <CardTitle>
                Opening inventory detail
              </CardTitle>
              <CardDescription>
                Quantity 0 tetap boleh dikirim untuk membuat
                item/mapping tanpa movement atau journal.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {currentInventoryLines.length === 0 ? (
                <div className="p-5">
                  <p className="text-muted-foreground text-sm">
                    Belum ada candidate yang dipilih.
                  </p>
                </div>
              ) : (
                <form.AppField
                  name="inventory_lines"
                  mode="array"
                >
                  {(field) => (
                    <div className="divide-border divide-y">
                      {field.state.value.map(
                        (
                          _line: InventoryLineFormValue,
                          index: number
                        ) => (
                          <div
                            key={
                              field.state.value[index]
                                .candidate_key
                            }
                            className="grid gap-4 p-5 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {
                                  field.state.value[index]
                                    .name
                                }
                              </p>
                              <p className="text-muted-foreground mt-1 text-xs">
                                {field.state.value[index]
                                  .sku || 'Tanpa SKU'}
                              </p>
                            </div>
                            <form.AppField
                              name={
                                ('inventory_lines[' +
                                  index +
                                  '].quantity') as never
                              }
                            >
                              {(nested) => (
                                <nested.MoneyField
                                  label="Quantity"
                                  suffix="unit"
                                />
                              )}
                            </form.AppField>
                            <form.AppField
                              name={
                                ('inventory_lines[' +
                                  index +
                                  '].unit_cost') as never
                              }
                            >
                              {(nested) => (
                                <nested.MoneyField label="Unit cost" />
                              )}
                            </form.AppField>
                            <form.AppField
                              name={
                                ('inventory_lines[' +
                                  index +
                                  '].location') as never
                              }
                            >
                              {(nested) => (
                                <nested.SelectField
                                  label="Location"
                                  items={locationItems}
                                  placeholder={
                                    locationItems.length
                                      ? 'Pilih location'
                                      : 'Default location'
                                  }
                                />
                              )}
                            </form.AppField>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </form.AppField>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    if (currentStep === 2) {
      const bankAccounts =
        (formValues.bank_accounts as BankAccountFormValue[]) ||
        [];
      return (
        <div className="flex flex-col gap-8">
          <SectionHeading
            eyebrow="Langkah 03 · Struktur akun"
            title="Buat setiap saldo punya rumah."
            description="Account yang dipilih berasal dari CoA organization. Rekening bank baru akan dibuat sebagai child account saat finalisasi."
          />
          {postableAccounts.length === 0 ? (
            <Alert className="border-warning/25 bg-warning/5">
              <HugeiconsIcon icon={InformationCircleIcon} />
              <AlertTitle>CoA belum tersedia</AlertTitle>
              <AlertDescription>
                Sistem sedang menyiapkan baseline Chart of
                Accounts.
              </AlertDescription>
            </Alert>
          ) : null}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>
                Account catalog dari backend
              </CardTitle>
              <CardDescription>
                Daftar ini berasal dari organization, bukan
                seed hardcoded di UI.
              </CardDescription>
              <CardAction>
                <Badge variant="outline">
                  {postableAccounts.length} postable account
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">
                      Kode
                    </TableHead>
                    <TableHead>Nama account</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead className="pr-4 text-right">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {postableAccounts
                    .slice(0, 12)
                    .map((account) => (
                      <TableRow key={account._id}>
                        <TableCell className="text-muted-foreground pl-4 font-mono text-xs">
                          {account.code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {accountLabel(account)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {account.type}
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <Badge variant="outline">
                            {account.subtype || 'postable'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTile icon={BankIcon} />
                  Rekening bank
                </CardTitle>
                <CardDescription>
                  Semua rekening dengan saldo dicatat
                  sebagai postable child account.
                </CardDescription>
                <CardAction>
                  <Dialog
                    open={isAccountDialogOpen}
                    onOpenChange={setIsAccountDialogOpen}
                  >
                    <DialogTrigger
                      render={
                        <Button type="button" size="sm" />
                      }
                    >
                      <HugeiconsIcon
                        icon={Add01Icon}
                        data-icon="inline-start"
                      />
                      Tambah rekening
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>
                          Tambah rekening bank
                        </DialogTitle>
                        <DialogDescription>
                          Nomor rekening lengkap tidak
                          disimpan. Empat digit terakhir
                          hanya untuk identifikasi.
                        </DialogDescription>
                      </DialogHeader>
                      <FieldGroup>
                        <form.AppField name="new_bank_name">
                          {(field) => (
                            <field.TextField
                              label="Nama rekening"
                              placeholder="Bank BCA Operasional"
                            />
                          )}
                        </form.AppField>
                        <form.AppField name="new_bank_institution">
                          {(field) => (
                            <field.TextField
                              label="Institusi"
                              placeholder="BCA"
                            />
                          )}
                        </form.AppField>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <form.AppField name="new_bank_last4">
                            {(field) => (
                              <field.TextField
                                label="4 digit terakhir"
                                placeholder="9910"
                              />
                            )}
                          </form.AppField>
                          <form.AppField name="new_bank_holder">
                            {(field) => (
                              <field.TextField
                                label="Pemilik rekening"
                                placeholder="Toko ABC"
                              />
                            )}
                          </form.AppField>
                        </div>
                        <form.AppField name="new_bank_balance">
                          {(field) => (
                            <field.MoneyField label="Saldo awal" />
                          )}
                        </form.AppField>
                      </FieldGroup>
                      <DialogFooter>
                        <DialogClose
                          render={
                            <Button
                              type="button"
                              variant="outline"
                            />
                          }
                        >
                          Batal
                        </DialogClose>
                        <Button
                          type="button"
                          onClick={addBankAccount}
                        >
                          Tambahkan rekening
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {bankAccounts.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Belum ada rekening yang dipilih.
                  </p>
                ) : (
                  <form.AppField
                    name="bank_accounts"
                    mode="array"
                  >
                    {(field) => (
                      <div className="flex flex-col gap-3">
                        {field.state.value.map(
                          (
                            account: BankAccountFormValue,
                            index: number
                          ) => (
                            <div
                              key={index}
                              className="bg-muted/50 flex flex-col gap-3 rounded-xl p-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">
                                    {account.name ||
                                      'Rekening baru'}
                                  </p>
                                  <p className="text-muted-foreground text-xs">
                                    {account.institution ||
                                      'Institusi belum diisi'}
                                    {account.account_last4
                                      ? ' •••• ' +
                                        account.account_last4
                                      : ''}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() =>
                                    field.removeValue(index)
                                  }
                                  aria-label="Hapus rekening"
                                >
                                  <HugeiconsIcon
                                    icon={Delete02Icon}
                                  />
                                </Button>
                              </div>
                              <form.AppField
                                name={
                                  ('bank_accounts[' +
                                    index +
                                    '].balance') as never
                                }
                              >
                                {(nested) => (
                                  <nested.MoneyField label="Saldo opening" />
                                )}
                              </form.AppField>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </form.AppField>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  Logical account mapping
                </CardTitle>
                <CardDescription>
                  Mapping hanya perlu diisi jika ingin
                  override resolver/default CoA.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                {renderAccountMapping(
                  'account_mappings.merchandise_inventory',
                  'Inventory asset',
                  assetAccountItems,
                  'Dipakai untuk inventory opening dan COGS.'
                )}
                {renderAccountMapping(
                  'account_mappings.opening_balance_equity',
                  'Opening equity',
                  equityAccountItems,
                  'Dipakai sebagai balancing opening balance.'
                )}
                {renderAccountMapping(
                  'account_mappings.sales_revenue',
                  'Sales revenue',
                  revenueAccountItems,
                  'Dipakai untuk posting order baru.'
                )}
                {renderAccountMapping(
                  'account_mappings.merchandise_cogs',
                  'Merchandise COGS',
                  expenseAccountItems,
                  'Resolver dapat memakai default jika dikosongkan.'
                )}
                {renderAccountMapping(
                  'account_mappings.expense_payable',
                  'Default expense payable',
                  liabilityAccountItems,
                  'Liability fallback untuk expense tanpa payment account.'
                )}
                <Separator />
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-sm font-medium">
                      Mapping per marketplace
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs leading-5">
                      Gunakan akun terpisah jika ingin
                      memisahkan piutang, saldo released,
                      dan biaya per platform. Kosongkan jika
                      fallback default sudah cukup.
                    </p>
                  </div>
                  <div className="flex flex-col gap-4">
                    {Object.values(ORDER_PLATFORMS).map(
                      (platform) => (
                        <div
                          key={platform.value}
                          className="bg-muted/40 grid gap-3 rounded-xl p-3 lg:grid-cols-3"
                        >
                          <div className="flex items-center">
                            <span className="text-sm font-medium">
                              {platform.label}
                            </span>
                          </div>
                          <form.AppField
                            name={
                              ('account_mappings.marketplace_receivables.' +
                                platform.value) as never
                            }
                          >
                            {(field) => (
                              <field.SelectField
                                label="Piutang"
                                items={assetAccountItems}
                                placeholder="Fallback / pilih akun"
                                disabled={
                                  assetAccountItems.length ===
                                  0
                                }
                              />
                            )}
                          </form.AppField>
                          <form.AppField
                            name={
                              ('account_mappings.marketplace_balances.' +
                                platform.value) as never
                            }
                          >
                            {(field) => (
                              <field.SelectField
                                label="Saldo released"
                                items={assetAccountItems}
                                placeholder="Fallback / pilih akun"
                                disabled={
                                  assetAccountItems.length ===
                                  0
                                }
                              />
                            )}
                          </form.AppField>
                          <form.AppField
                            name={
                              ('account_mappings.marketplace_fee_accounts.' +
                                platform.value) as never
                            }
                          >
                            {(field) => (
                              <field.SelectField
                                label="Biaya marketplace"
                                items={expenseAccountItems}
                                placeholder="Fallback / pilih akun"
                                disabled={
                                  expenseAccountItems.length ===
                                  0
                                }
                              />
                            )}
                          </form.AppField>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    if (currentStep === 3) {
      const adjustmentLines =
        (formValues.opening_balance_adjustments as OpeningAdjustmentFormValue[]) ||
        [];
      return (
        <div className="flex flex-col gap-8">
          <SectionHeading
            eyebrow="Langkah 04 · Saldo awal"
            title="Masukkan kondisi nyata bisnis."
            description="Backend akan membentuk satu opening journal yang menggabungkan bank, inventory, receivable, liability, dan balancing equity."
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Bank"
              value={formatIDR(totalBankValue)}
              note={
                formValues.bank_accounts.length +
                ' rekening'
              }
              icon={BankIcon}
            />
            <MetricCard
              label="Inventory detail"
              value={formatIDR(totalInventoryValue)}
              note={selectedInventoryCount + ' line'}
              icon={Package02Icon}
            />
            <MetricCard
              label="Adjustment"
              value={String(adjustmentLines.length)}
              note="receivable/liability/equity"
              icon={Chart03Icon}
            />
          </div>
          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <Card>
              <CardHeader>
                <CardTitle>
                  Saldo bank dan inventory
                </CardTitle>
                <CardDescription>
                  Nilai inventory harus berupa cost, bukan
                  selling price. Rekening bank dipilih pada
                  langkah sebelumnya.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                {formValues.bank_accounts.length === 0 ? (
                  <Alert>
                    <HugeiconsIcon
                      icon={InformationCircleIcon}
                    />
                    <AlertTitle>
                      Belum ada rekening bank
                    </AlertTitle>
                    <AlertDescription>
                      Jika memang tidak ada saldo bank
                      opening, lanjutkan tanpa rekening.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <form.AppField
                    name="bank_accounts"
                    mode="array"
                  >
                    {(field) => (
                      <div className="flex flex-col gap-3">
                        {field.state.value.map(
                          (
                            account: BankAccountFormValue,
                            index: number
                          ) => (
                            <form.AppField
                              key={index}
                              name={
                                ('bank_accounts[' +
                                  index +
                                  '].balance') as never
                              }
                            >
                              {(nested) => (
                                <nested.MoneyField
                                  label={
                                    account.name ||
                                    'Rekening bank'
                                  }
                                />
                              )}
                            </form.AppField>
                          )
                        )}
                      </div>
                    )}
                  </form.AppField>
                )}
                {formValues.inventory_mode ===
                'aggregate' ? (
                  <form.AppField name="aggregate_inventory_value">
                    {(field) => (
                      <field.MoneyField
                        label="Aggregate inventory value"
                        description="Dipakai jika tidak mengirim detail inventory."
                      />
                    )}
                  </form.AppField>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Detail opening quantity dan unit cost
                    diisi pada langkah Kesiapan data.
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  Adjustment opening balance
                </CardTitle>
                <CardDescription>
                  Gunakan account aktual dari CoA untuk
                  piutang marketplace, hutang supplier,
                  keluarga, bank, atau finance company.
                </CardDescription>
                <CardAction>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      addOpeningAdjustment();
                    }}
                  >
                    <HugeiconsIcon
                      icon={Add01Icon}
                      data-icon="inline-start"
                    />
                    Tambah line
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                {adjustmentLines.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Tidak ada adjustment. Backend akan
                    menyeimbangkan bank/inventory dengan
                    equity.
                  </p>
                ) : (
                  <form.AppField
                    name="opening_balance_adjustments"
                    mode="array"
                  >
                    {(field) => (
                      <div className="flex flex-col gap-4">
                        {field.state.value.map(
                          (
                            _line: OpeningAdjustmentFormValue,
                            index: number
                          ) => (
                            <div
                              key={index}
                              className="bg-muted/50 flex flex-col gap-3 rounded-xl p-3"
                            >
                              <div className="flex items-start gap-2">
                                <div className="min-w-0 flex-1">
                                  <form.AppField
                                    name={
                                      ('opening_balance_adjustments[' +
                                        index +
                                        '].account') as never
                                    }
                                  >
                                    {(nested) => (
                                      <nested.SelectField
                                        label="Account"
                                        items={
                                          openingBalanceAccountItems
                                        }
                                        placeholder="Pilih account"
                                      />
                                    )}
                                  </form.AppField>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() =>
                                    field.removeValue(index)
                                  }
                                  aria-label="Hapus opening line"
                                >
                                  <HugeiconsIcon
                                    icon={Delete02Icon}
                                  />
                                </Button>
                              </div>
                              <div className="grid gap-3 sm:grid-cols-2">
                                <form.AppField
                                  name={
                                    ('opening_balance_adjustments[' +
                                      index +
                                      '].debit') as never
                                  }
                                >
                                  {(nested) => (
                                    <nested.MoneyField label="Debit" />
                                  )}
                                </form.AppField>
                                <form.AppField
                                  name={
                                    ('opening_balance_adjustments[' +
                                      index +
                                      '].credit') as never
                                  }
                                >
                                  {(nested) => (
                                    <nested.MoneyField label="Credit" />
                                  )}
                                </form.AppField>
                              </div>
                              <div className="grid gap-3 sm:grid-cols-2">
                                <form.AppField
                                  name={
                                    ('opening_balance_adjustments[' +
                                      index +
                                      '].counterparty') as never
                                  }
                                >
                                  {(nested) => (
                                    <nested.TextField
                                      label="Pihak terkait"
                                      placeholder="Supplier, keluarga, bank, atau finance"
                                    />
                                  )}
                                </form.AppField>
                                <form.AppField
                                  name={
                                    ('opening_balance_adjustments[' +
                                      index +
                                      '].due_date') as never
                                  }
                                >
                                  {(nested) => (
                                    <nested.TextField
                                      label="Jatuh tempo"
                                      type="date"
                                    />
                                  )}
                                </form.AppField>
                              </div>
                              <form.AppField
                                name={
                                  ('opening_balance_adjustments[' +
                                    index +
                                    '].description') as never
                                }
                              >
                                {(nested) => (
                                  <nested.TextField
                                    label="Catatan"
                                    placeholder="Contoh: pinjaman modal kerja bulan Januari"
                                  />
                                )}
                              </form.AppField>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </form.AppField>
                )}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Opening journal preview</CardTitle>
              <CardDescription>
                Preview selalu dihitung dari backend sebelum
                user dapat mengaktifkan accounting.
              </CardDescription>
              <CardAction>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void refreshOpeningPreview().catch(
                      handleApiError
                    )
                  }
                  disabled={isRefreshingPreview}
                >
                  {isRefreshingPreview ? (
                    <Spinner data-icon="inline-start" />
                  ) : null}
                  Hitung preview
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {!openingPreview ? (
                <Alert>
                  <HugeiconsIcon
                    icon={InformationCircleIcon}
                  />
                  <AlertTitle>
                    Preview belum dihitung
                  </AlertTitle>
                  <AlertDescription>
                    Setelah mengubah saldo, adjustment, atau
                    mapping, hitung ulang preview sebelum
                    melanjutkan ke finalisasi.
                  </AlertDescription>
                </Alert>
              ) : null}
              {openingPreview?.blockers.length ? (
                <Alert variant="destructive">
                  <HugeiconsIcon
                    icon={InformationCircleIcon}
                  />
                  <AlertTitle>
                    Masih ada yang perlu diperbaiki
                  </AlertTitle>
                  <AlertDescription>
                    <ul className="flex flex-col gap-1">
                      {openingPreview.blockers.map(
                        (blocker) => (
                          <li key={blocker}>{blocker}</li>
                        )
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}
              {openingPreview?.warnings.length ? (
                <Alert className="border-warning/25 bg-warning/5">
                  <HugeiconsIcon
                    icon={InformationCircleIcon}
                  />
                  <AlertTitle>Catatan</AlertTitle>
                  <AlertDescription>
                    <ul className="flex flex-col gap-1">
                      {openingPreview.warnings.map(
                        (warning) => (
                          <li key={warning}>{warning}</li>
                        )
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-muted-foreground text-xs">
                    Total asset
                  </p>
                  <p className="mt-1 font-mono text-lg font-semibold">
                    {formatIDR(
                      openingPreview?.opening_balance
                        .total_assets ??
                        totalBankValue + totalInventoryValue
                    )}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-muted-foreground text-xs">
                    Equity credit
                  </p>
                  <p className="mt-1 font-mono text-lg font-semibold">
                    {formatIDR(
                      openingPreview?.opening_balance
                        .suggested_equity_credit ?? 0
                    )}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-muted-foreground text-xs">
                    Period
                  </p>
                  <p className="mt-1 font-mono text-lg font-semibold">
                    {openingPreview?.period || '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    const summary = openingPreview?.opening_balance;
    return (
      <div className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="Langkah 05 · Final review"
          title="Satu pandangan sebelum buku dibuka."
          description="Finalisasi akan membuat opening journal, inventory movement yang diperlukan, lalu mengubah state organization menjadi active dalam satu transaction."
        />
        {!openingPreview ? (
          <Alert>
            <HugeiconsIcon icon={InformationCircleIcon} />
            <AlertTitle>
              Preview perlu dihitung ulang
            </AlertTitle>
            <AlertDescription>
              Kembali ke langkah Saldo awal dan hitung
              preview terbaru sebelum mengaktifkan
              accounting.
            </AlertDescription>
          </Alert>
        ) : null}
        {openingPreview?.blockers.length ? (
          <Alert variant="destructive">
            <HugeiconsIcon icon={InformationCircleIcon} />
            <AlertTitle>Finalisasi belum siap</AlertTitle>
            <AlertDescription>
              Kembali ke langkah Saldo awal untuk
              memperbaiki blocker dari backend.
            </AlertDescription>
          </Alert>
        ) : null}
        <div className="grid gap-5 lg:grid-cols-[1fr_0.78fr]">
          <Card>
            <CardHeader>
              <CardTitle>Accounting snapshot</CardTitle>
              <CardDescription>
                Per {formValues.cutover_date || 'cutover'} ·
                IDR
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {[
                [
                  'Kas dan bank',
                  openingPreview?.bank_accounts
                    .total_balance ?? totalBankValue,
                  BankIcon,
                ],
                [
                  'Inventory',
                  openingPreview?.inventory.total_value ??
                    totalInventoryValue,
                  Package02Icon,
                ],
                [
                  'Opening asset',
                  summary?.total_assets ??
                    totalBankValue + totalInventoryValue,
                  Chart03Icon,
                ],
                [
                  'Equity balancing',
                  summary?.suggested_equity_credit ?? 0,
                  Wallet02Icon,
                ],
              ].map(([label, value, icon]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <IconTile
                      icon={icon as typeof Calendar03Icon}
                      tone="muted"
                    />
                    <span className="truncate text-sm font-medium">
                      {String(label)}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-semibold tabular-nums">
                    {formatIDR(Number(value))}
                  </span>
                </div>
              ))}
              <Separator />
              <div
                className={cn(
                  'flex items-center justify-between rounded-xl border px-4 py-3',
                  openingPreview === null
                    ? 'bg-muted/50 border-border'
                    : openingPreview.can_finalize
                      ? 'bg-primary/5 border-primary/15'
                      : 'bg-destructive/5 border-destructive/20'
                )}
              >
                <span className="text-sm font-medium">
                  Backend readiness
                </span>
                <Badge
                  variant={
                    openingPreview === null
                      ? 'secondary'
                      : openingPreview.can_finalize
                        ? 'success'
                        : 'destructive'
                  }
                >
                  {openingPreview === null
                    ? 'Preview belum dihitung'
                    : openingPreview.can_finalize
                      ? 'Siap difinalisasi'
                      : 'Perlu perbaikan'}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle>Konfirmasi finalisasi</CardTitle>
              <CardDescription>
                Setelah active, onboarding tidak dapat
                dibuka kembali.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <form.AppField name="confirmation">
                {(field) => (
                  <field.SwitchField
                    label="Saya sudah review"
                    description="Saya memahami setup standar tidak merekonstruksi histori order."
                  />
                )}
              </form.AppField>
              <form.AppField name="description">
                {(field) => (
                  <field.TextareaField
                    label="Deskripsi opening journal"
                    className="min-h-24 resize-none"
                  />
                )}
              </form.AppField>
              <Alert className="border-primary/20 bg-primary/5">
                <HugeiconsIcon icon={SecurityCheckIcon} />
                <AlertTitle>
                  Transaction boundary
                </AlertTitle>
                <AlertDescription>
                  Organization baru menjadi active setelah
                  opening balance, inventory, dan lifecycle
                  state berhasil.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <main className="bg-muted/20 flex min-h-full items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center gap-3 p-6">
            <Spinner />
            <div>
              <p className="font-medium">
                Menyiapkan accounting onboarding
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                Memuat organization, CoA, dan product
                readiness.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (errorMessage && !onboarding) {
    return (
      <main className="bg-muted/20 flex min-h-full items-center justify-center px-4 py-8">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>
              Accounting onboarding belum tersedia
            </CardTitle>
            <CardDescription>
              Backend tidak dapat memuat state organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <HugeiconsIcon icon={InformationCircleIcon} />
              <AlertTitle>Request gagal</AlertTitle>
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button
              type="button"
              onClick={() => window.location.reload()}
            >
              Coba lagi
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  if (isComplete) {
    return (
      <main className="bg-muted/20 flex min-h-full flex-col justify-center px-4 py-8 lg:px-8">
        <Card className="mx-auto w-full max-w-2xl overflow-hidden">
          <div className="bg-foreground text-background relative overflow-hidden px-6 py-12 text-center sm:px-12">
            <div className="bg-primary/30 absolute -top-24 left-1/2 size-64 -translate-x-1/2 rounded-full blur-3xl" />
            <div className="relative mx-auto flex max-w-md flex-col items-center gap-5">
              <span className="bg-primary/20 text-primary grid size-16 place-items-center rounded-2xl">
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={34}
                />
              </span>
              <div>
                <p className="text-background/60 text-xs font-semibold tracking-[0.18em] uppercase">
                  Accounting active
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                  Buku accounting berhasil dibuka.
                </h1>
                <p className="text-background/65 mt-3 text-sm leading-6">
                  Opening journal dan baseline inventory
                  sudah diproses oleh backend.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  router.replace('/dashboard/accounting')
                }
              >
                Buka accounting desk
                <HugeiconsIcon
                  icon={ArrowRight02Icon}
                  data-icon="inline-end"
                />
              </Button>
              {completion?.period?.period_key ? (
                <Badge variant="secondary">
                  Period {completion.period.period_key}
                </Badge>
              ) : null}
            </div>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="bg-muted/20 min-h-full overflow-x-hidden px-4 py-5 lg:px-8 lg:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="bg-foreground text-background relative overflow-hidden rounded-3xl px-6 py-7 shadow-2xl sm:px-8 sm:py-9">
          <div className="bg-primary/25 absolute -top-28 right-12 size-72 rounded-full blur-3xl" />
          <div className="bg-secondary/20 absolute -bottom-36 left-1/3 size-80 rounded-full blur-3xl" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  <HugeiconsIcon
                    icon={SparklesIcon}
                    data-icon="inline-start"
                  />
                  Accounting onboarding
                </Badge>
                <span className="text-background/60 text-xs">
                  Backend-connected
                </span>
              </div>
              <h1 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-5xl">
                Bangun fondasi angka yang bisa dipercaya.
              </h1>
              <p className="text-background/65 mt-4 max-w-xl text-sm leading-6 sm:text-base">
                Pilih data yang benar-benar relevan, lihat
                preview journal dari backend, lalu aktifkan
                accounting satu kali dengan tenang.
              </p>
            </div>
            <div className="border-background/15 bg-background/10 w-full rounded-2xl border p-4 lg:max-w-56">
              <p className="text-background/60 text-xs font-medium tracking-[0.16em] uppercase">
                Langkah sekarang
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {String(currentStep + 1).padStart(2, '0')}{' '}
                <span className="text-background/50 text-base font-normal">
                  / 05
                </span>
              </p>
              <p className="text-background/65 mt-1 text-sm">
                {step.title}
              </p>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <Alert variant="destructive">
            <HugeiconsIcon icon={InformationCircleIcon} />
            <AlertTitle>Perlu perhatian</AlertTitle>
            <AlertDescription>
              {errorMessage}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="overflow-x-auto pb-1">
          <Stepper
            steps={steps}
            currentStep={currentStep}
            onStepChange={(nextStep) =>
              void goToStep(nextStep)
            }
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <Card className="min-w-0">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (isLastStep) {
                  void form.handleSubmit();
                } else {
                  void goNext();
                }
              }}
            >
              <CardHeader className="bg-background/60 border-b">
                <div className="flex items-center gap-3">
                  <IconTile icon={step.icon} />
                  <div>
                    <CardTitle>{step.title}</CardTitle>
                    <CardDescription>
                      {step.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-8">
                {renderStep()}
              </CardContent>
              <CardFooter className="bg-background/60 justify-between gap-3 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={goPrevious}
                  disabled={
                    currentStep === 0 || isFinalizing
                  }
                >
                  <HugeiconsIcon
                    icon={ArrowLeft02Icon}
                    data-icon="inline-start"
                  />
                  Kembali
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isFinalizing || isRefreshingPreview
                  }
                >
                  {isFinalizing ? (
                    <Spinner data-icon="inline-start" />
                  ) : null}
                  {isLastStep
                    ? 'Aktifkan accounting'
                    : 'Lanjutkan'}
                  <HugeiconsIcon
                    icon={ArrowRight02Icon}
                    data-icon="inline-end"
                  />
                </Button>
              </CardFooter>
            </form>
          </Card>
          <aside className="flex flex-col gap-4">
            <Card className="bg-primary/5 border-primary/15">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <HugeiconsIcon
                    icon={SecurityCheckIcon}
                    size={18}
                  />
                  Prinsip setup
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {(
                  [
                    [
                      'Satu organization, satu ledger.',
                      Building03Icon,
                    ],
                    [
                      'Preview sebelum posting.',
                      FileEditIcon,
                    ],
                    [
                      'Inventory tidak dibuat massal.',
                      Package02Icon,
                    ],
                  ] as Array<
                    [string, typeof Calendar03Icon]
                  >
                ).map(([label, icon]) => (
                  <div
                    key={String(label)}
                    className="flex items-start gap-3"
                  >
                    <span className="text-primary mt-0.5">
                      <HugeiconsIcon
                        icon={icon as typeof Calendar03Icon}
                        size={18}
                      />
                    </span>
                    <p className="text-muted-foreground text-sm leading-5">
                      {label}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent className="flex gap-3 p-4">
                <HugeiconsIcon
                  icon={InformationCircleIcon}
                  size={18}
                  className="text-muted-foreground mt-0.5 shrink-0"
                />
                <p className="text-muted-foreground text-xs leading-5">
                  Next/Prev tidak memaksa validasi lokal.
                  Backend preview dan finalization menjadi
                  sumber keputusan readiness.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}
