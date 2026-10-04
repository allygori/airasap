import { z } from 'zod';
import {
  Calendar03Icon,
  BankIcon,
  Chart03Icon,
  Package02Icon,
  SecurityCheckIcon,
} from '@hugeicons/core-free-icons';
import type { StepperStep } from '@/components/ui/stepper';
import { formatNumber } from '@/lib/number';
import {
  FINANCE_DEFAULT_CALENDAR_TIMEZONE,
  FinanceCalendarTimezoneValueSchema,
  getFinanceCalendarDate,
  type FinanceCalendarTimezone,
} from '@/modules/finance/client';
import type {
  FinanceOpeningBalanceSetupResponseDTO,
  FinanceOpeningBalancePreviewDTO,
} from '@/modules/finance/client';

const AmountTextSchema = z
  .string()
  .regex(/^\d{0,15}$/, 'Masukkan nominal dalam angka.');

const InventoryLineFormSchema = z.object({
  line_key: z.string().min(1),
  inventory_item_id: z.string(),
  location_id: z.string(),
  quantity: AmountTextSchema,
  unit_cost: AmountTextSchema,
});

const OpeningSubledgerLineFormSchema = z.object({
  line_key: z.string().min(1),
  account_id: z.string(),
  amount: AmountTextSchema,
  counterparty: z.string().max(160),
  reference: z.string().max(160),
});

export const FinanceOpeningBalanceFormValuesSchema = z
  .object({
    cut_off_date: z.string().date(),
    calendar_timezone: FinanceCalendarTimezoneValueSchema,
    mode: z.enum(['entered', 'zero']),
    description: z.string().max(240),
    cash_bank_lines: z.array(
      z.object({
        account_id: z.string().min(1),
        amount: AmountTextSchema,
      })
    ),
    inventory_lines: z
      .array(InventoryLineFormSchema)
      .max(500),
    payable_lines: z
      .array(OpeningSubledgerLineFormSchema)
      .max(100),
    receivable_lines: z
      .array(OpeningSubledgerLineFormSchema)
      .max(100),
    owner_capital_account_id: z.string(),
    owner_capital_amount: AmountTextSchema,
  })
  .strict();

export type FinanceOpeningBalanceFormValues = z.infer<
  typeof FinanceOpeningBalanceFormValuesSchema
>;

export type FinanceOpeningBalanceMode =
  FinanceOpeningBalanceFormValues['mode'];

export type FinanceOpeningBalanceStep =
  | 'start'
  | 'accounts'
  | 'inventory'
  | 'liabilities'
  | 'review';

export type FinanceOpeningBalanceStepDefinition =
  StepperStep & { key: FinanceOpeningBalanceStep };

const allSteps: FinanceOpeningBalanceStepDefinition[] = [
  {
    key: 'start',
    title: 'Mulai',
    description: 'Tanggal dan pilihan saldo',
    icon: Calendar03Icon,
  },
  {
    key: 'accounts',
    title: 'Kas & bank',
    description: 'Rekening dan saldo',
    icon: BankIcon,
  },
  {
    key: 'inventory',
    title: 'Persediaan',
    description: 'Stok awal toko',
    icon: Package02Icon,
  },
  {
    key: 'liabilities',
    title: 'Utang & modal',
    description: 'Saldo lain yang relevan',
    icon: Chart03Icon,
  },
  {
    key: 'review',
    title: 'Review',
    description: 'Periksa sebelum aktif',
    icon: SecurityCheckIcon,
  },
];

export const getFinanceOpeningBalanceSteps = (
  mode: FinanceOpeningBalanceMode
): FinanceOpeningBalanceStepDefinition[] =>
  mode === 'zero'
    ? [allSteps[0], allSteps[1], allSteps[4]]
    : allSteps;

export const parseFinanceOpeningBalanceMode = (
  value: string | null
): FinanceOpeningBalanceMode | null =>
  value === 'entered' || value === 'zero' ? value : null;

export const parseFinanceOpeningBalanceStep = (
  value: string | null
): FinanceOpeningBalanceStep | null =>
  allSteps.some((step) => step.key === value)
    ? (value as FinanceOpeningBalanceStep)
    : null;

export const resolveFinanceOpeningBalanceStep = (
  mode: FinanceOpeningBalanceMode,
  requestedStep: FinanceOpeningBalanceStep | null,
  isResumable: boolean
): FinanceOpeningBalanceStep => {
  if (isResumable) return 'review';

  const availableSteps =
    getFinanceOpeningBalanceSteps(mode);
  if (
    requestedStep &&
    availableSteps.some(
      (step) => step.key === requestedStep
    )
  ) {
    return requestedStep;
  }

  return mode === 'zero' ? 'accounts' : 'start';
};

export const buildFinanceOpeningBalanceHref = (
  pathname: string,
  currentQuery: string,
  mode: FinanceOpeningBalanceMode,
  step: FinanceOpeningBalanceStep
) => {
  const params = new URLSearchParams(currentQuery);
  params.set('mode', mode);
  params.set('step', step);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
};

export const getTodayDateInputValue = (
  timeZone: FinanceCalendarTimezone = FINANCE_DEFAULT_CALENDAR_TIMEZONE
) => getFinanceCalendarDate(new Date(), timeZone);

const getCutOffDateValue = (
  value: string | null | undefined,
  timeZone: FinanceCalendarTimezone
) => {
  const parsed = z.string().date().safeParse(value);
  return parsed.success
    ? parsed.data
    : getTodayDateInputValue(timeZone);
};

export const createFinanceOpeningBalanceFormValues = (
  setup: FinanceOpeningBalanceSetupResponseDTO,
  modeOverride?: FinanceOpeningBalanceMode
): FinanceOpeningBalanceFormValues => {
  const draft = setup.draft;
  const accountsById = new Map(
    setup.options.cash_bank_accounts.map((account) => [
      account.id,
      account,
    ])
  );
  const savedCashBankLines = draft?.cash_bank_lines ?? [];
  const cashBankLines =
    setup.options.cash_bank_accounts.map((account) => ({
      account_id: account.id,
      amount: String(
        savedCashBankLines.find(
          (line) => line.account_id === account.id
        )?.amount ?? ''
      ),
    }));

  for (const line of savedCashBankLines) {
    if (!accountsById.has(line.account_id)) {
      cashBankLines.push({
        account_id: line.account_id,
        amount: String(line.amount),
      });
    }
  }

  return {
    cut_off_date: getCutOffDateValue(
      draft?.cut_off_date,
      setup.calendar_timezone
    ),
    calendar_timezone: setup.calendar_timezone,
    mode: modeOverride ?? draft?.mode ?? 'entered',
    description: draft?.description ?? 'Saldo awal Finance',
    cash_bank_lines: cashBankLines,
    inventory_lines:
      draft?.inventory_lines.map((line, index) => ({
        line_key: `opening-inventory-${index}`,
        inventory_item_id: line.inventory_item_id,
        location_id: line.location_id,
        quantity:
          line.quantity > 0 ? String(line.quantity) : '',
        unit_cost: String(line.unit_cost ?? ''),
      })) ?? [],
    payable_lines:
      draft?.payable_lines.map((line, index) => ({
        line_key: `opening-payable-${index}`,
        account_id: line.account_id,
        amount: String(line.amount),
        counterparty: line.counterparty ?? '',
        reference: line.reference ?? '',
      })) ?? [],
    receivable_lines:
      draft?.receivable_lines.map((line, index) => ({
        line_key: `opening-receivable-${index}`,
        account_id: line.account_id,
        amount: String(line.amount),
        counterparty: line.counterparty ?? '',
        reference: line.reference ?? '',
      })) ?? [],
    owner_capital_account_id:
      draft?.owner_capital_account_id ??
      setup.options.equity_accounts[0]?.id ??
      '',
    owner_capital_amount: String(
      draft?.owner_capital_amount ?? 0
    ),
  };
};

export const createEmptyFinanceOpeningBalanceFormValues = (
  mode: FinanceOpeningBalanceMode = 'entered'
): FinanceOpeningBalanceFormValues => ({
  cut_off_date: getTodayDateInputValue(),
  calendar_timezone: FINANCE_DEFAULT_CALENDAR_TIMEZONE,
  mode,
  description: 'Saldo awal Finance',
  cash_bank_lines: [],
  inventory_lines: [],
  payable_lines: [],
  receivable_lines: [],
  owner_capital_account_id: '',
  owner_capital_amount: '0',
});

export const getEligibleInventoryItems = (
  setup: FinanceOpeningBalanceSetupResponseDTO
) =>
  setup.options.inventory_items.filter(
    (item) =>
      item.item_type !== 'fixed_asset' &&
      item.track_quantity &&
      item.track_value
  );

export const createEmptyInventoryLine = (
  setup: FinanceOpeningBalanceSetupResponseDTO
) => ({
  line_key: crypto.randomUUID(),
  inventory_item_id:
    getEligibleInventoryItems(setup)[0]?.id ?? '',
  location_id: setup.options.locations[0]?.id ?? '',
  quantity: '',
  unit_cost: '',
});

export const numberValue = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export const formatMoney = (value: number) =>
  `Rp ${formatNumber(value, 3)}`;

export const isResumableFinanceOpeningBalanceDraft = (
  setup: FinanceOpeningBalanceSetupResponseDTO | null
) =>
  setup?.draft?.status === 'finalizing' ||
  setup?.draft?.status === 'posted' ||
  setup?.draft?.status === 'skipped';

export type { FinanceOpeningBalancePreviewDTO };
