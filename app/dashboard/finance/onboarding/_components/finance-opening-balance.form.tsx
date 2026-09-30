/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import { useStore } from '@tanstack/react-form';
import { formatNumber } from '@/lib/number';
import type { ComponentProps } from 'react';
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  BankIcon,
  Calendar03Icon,
  Chart03Icon,
  InformationCircleIcon,
  Package02Icon,
  SecurityCheckIcon,
} from '@hugeicons/core-free-icons';
import Link from 'next/link';
import { z } from 'zod';
import { HugeiconsIcon } from '@/components/icons/hugeicons-icon';
import { withForm } from '@/components/form/form.hook';
import {
  Alert,
  AlertDescription,
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
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldGroup } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import {
  Stepper,
  type StepperStep,
} from '@/components/ui/stepper';
import { Spinner } from '@/components/ui/spinner';
import {
  FINANCE_CALENDAR_TIMEZONE_OPTIONS,
  FINANCE_DEFAULT_CALENDAR_TIMEZONE,
  FINANCE_CASH_BANK_SUBTYPE_LABELS,
  FinanceCalendarTimezoneValueSchema,
  getFinanceCalendarDate,
  type FinanceCalendarTimezone,
  type FinanceOpeningBalancePreviewDTO,
  type FinanceOpeningBalanceSetupResponseDTO,
} from '@/modules/finance/client';
import { cn } from '@/lib/utils/ui';
import {
  FinanceBankAccountForm,
  type FinanceBankAccountFormApi,
} from './finance-bank-account.form';

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

export type FinanceOpeningBalanceStep =
  | 'start'
  | 'accounts'
  | 'inventory'
  | 'liabilities'
  | 'review';

type StepDefinition = StepperStep & {
  key: FinanceOpeningBalanceStep;
};

const allSteps: StepDefinition[] = [
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
  mode: FinanceOpeningBalanceFormValues['mode']
): StepDefinition[] =>
  mode === 'zero' ? [allSteps[0], allSteps[4]] : allSteps;

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
  setup: FinanceOpeningBalanceSetupResponseDTO
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
    mode: draft?.mode ?? 'entered',
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

export const createEmptyFinanceOpeningBalanceFormValues =
  (): FinanceOpeningBalanceFormValues => ({
    cut_off_date: getTodayDateInputValue(),
    calendar_timezone: FINANCE_DEFAULT_CALENDAR_TIMEZONE,
    mode: 'entered',
    description: 'Saldo awal Finance',
    cash_bank_lines: [],
    inventory_lines: [],
    payable_lines: [],
    receivable_lines: [],
    owner_capital_account_id: '',
    owner_capital_amount: '0',
  });

const emptySetup = {
  finance_status: 'in_progress',
  calendar_timezone: FINANCE_DEFAULT_CALENDAR_TIMEZONE,
  draft: null,
  options: {
    cash_bank_accounts: [],
    liability_accounts: [],
    credit_payable_accounts: [],
    receivable_accounts: [],
    equity_accounts: [],
    retained_earnings_accounts: [],
    inventory_items: [],
    locations: [],
  },
  summary: {
    cash_bank_total: 0,
    inventory_total: 0,
    receivable_total: 0,
    total_assets: 0,
    payable_total: 0,
    owner_capital_total: 0,
    retained_earnings_balance: 0,
  },
} satisfies FinanceOpeningBalanceSetupResponseDTO;

type FinanceOpeningBalanceFormProps = {
  setup: FinanceOpeningBalanceSetupResponseDTO;
  step: FinanceOpeningBalanceStep;
  onStepChange: (step: FinanceOpeningBalanceStep) => void;
  onModeChange: (
    mode: FinanceOpeningBalanceFormValues['mode']
  ) => void;
  bankAccountForm?: FinanceBankAccountFormApi;
  isAddingBankAccount: boolean;
  isCreatingBankAccount: boolean;
  onStartAddBankAccount: () => void;
  onCancelAddBankAccount: () => void;
  onRefreshInventory: () => void;
  isRefreshingInventory: boolean;
  preparableProductCount: number | null;
  isLoadingProductCount: boolean;
  isPreparingProducts: boolean;
  productCountError: string | null;
  onPrepareProducts: () => void;
  isSaving: boolean;
  isPreviewing: boolean;
  isFinalizing: boolean;
  isFinalized: boolean;
  isResumable: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  preview: FinanceOpeningBalancePreviewDTO | null;
  confirmed: boolean;
  onConfirmedChange: (confirmed: boolean) => void;
  onSaveAndContinue: () => void;
  onPreview: () => void;
  onFinalize: () => void;
};

export const FinanceOpeningBalanceForm = withForm({
  defaultValues:
    createEmptyFinanceOpeningBalanceFormValues(),
  props: {
    setup: emptySetup,
    step: 'start',
    onStepChange: () => undefined,
    onModeChange: () => undefined,
    isAddingBankAccount: false,
    isCreatingBankAccount: false,
    onStartAddBankAccount: () => undefined,
    onCancelAddBankAccount: () => undefined,
    onRefreshInventory: () => undefined,
    isRefreshingInventory: false,
    preparableProductCount: null,
    isLoadingProductCount: false,
    isPreparingProducts: false,
    productCountError: null,
    onPrepareProducts: () => undefined,
    isSaving: false,
    isPreviewing: false,
    isFinalizing: false,
    isFinalized: false,
    isResumable: false,
    errorMessage: null,
    successMessage: null,
    preview: null,
    confirmed: false,
    onConfirmedChange: () => undefined,
    onSaveAndContinue: () => undefined,
    onPreview: () => undefined,
    onFinalize: () => undefined,
  } as FinanceOpeningBalanceFormProps,
  render: function Render({
    form,
    setup,
    step,
    onStepChange,
    onModeChange,
    bankAccountForm,
    isAddingBankAccount,
    isCreatingBankAccount,
    onStartAddBankAccount,
    onCancelAddBankAccount,
    onRefreshInventory,
    isRefreshingInventory,
    preparableProductCount,
    isLoadingProductCount,
    isPreparingProducts,
    productCountError,
    onPrepareProducts,
    isSaving,
    isPreviewing,
    isFinalizing,
    isFinalized,
    isResumable,
    errorMessage,
    successMessage,
    preview,
    confirmed,
    onConfirmedChange,
    onSaveAndContinue,
    onPreview,
    onFinalize,
  }) {
    const values = useStore(
      form.store,
      (state) => state.values
    );
    const steps = getFinanceOpeningBalanceSteps(
      values.mode
    );
    const currentStepIndex = Math.max(
      0,
      steps.findIndex((item) => item.key === step)
    );
    const activeStep =
      steps[currentStepIndex] ?? allSteps[0];
    const cashBankTotal =
      values.mode === 'zero'
        ? 0
        : values.cash_bank_lines.reduce(
            (sum, line) => sum + numberValue(line.amount),
            0
          );
    const inventoryTotal =
      values.mode === 'zero'
        ? 0
        : values.inventory_lines.reduce(
            (sum, line) =>
              sum +
              numberValue(line.quantity) *
                numberValue(line.unit_cost),
            0
          );
    const receivableTotal =
      values.mode === 'zero'
        ? 0
        : values.receivable_lines.reduce(
            (sum, line) => sum + numberValue(line.amount),
            0
          );
    const payableTotal =
      values.mode === 'zero'
        ? 0
        : values.payable_lines.reduce(
            (sum, line) => sum + numberValue(line.amount),
            0
          );
    const capitalTotal =
      values.mode === 'zero'
        ? 0
        : numberValue(values.owner_capital_amount);
    const retainedTotal =
      cashBankTotal +
      inventoryTotal +
      receivableTotal -
      payableTotal -
      capitalTotal;
    const isBusy =
      isSaving ||
      isPreparingProducts ||
      isPreviewing ||
      isFinalizing ||
      isFinalized ||
      isResumable;
    const stepperSteps: StepperStep[] = steps.map(
      ({ title, description, icon }) => ({
        title,
        description,
        icon,
      })
    );

    const changeToPreviousStep = () => {
      const previousStep = steps[currentStepIndex - 1];
      if (previousStep) onStepChange(previousStep.key);
    };

    return (
      <section className="grid min-w-0 gap-6">
        <header className="bg-card relative overflow-hidden rounded-2xl border p-6 shadow-sm sm:p-8">
          <div
            aria-hidden="true"
            className="bg-primary/10 pointer-events-none absolute -top-24 -right-20 size-64 rounded-full blur-3xl"
          />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <Badge variant="secondary">
                Finance / Pengaturan awal
              </Badge>
              <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Catat saldo awal usaha
              </h1>
              <p className="text-muted-foreground max-w-xl text-sm leading-6 sm:text-base">
                Masukkan saldo kas dan bank, persediaan,
                piutang, serta kewajiban pada tanggal mulai.
                Bagian yang belum siap dapat dilewati;
                jurnal ditinjau sebelum Finance diaktifkan.
              </p>
            </div>
            <div className="bg-muted/30 w-full rounded-xl border p-4 lg:max-w-56">
              <p className="text-muted-foreground text-xs font-medium tracking-[0.16em] uppercase">
                Langkah saat ini
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {String(currentStepIndex + 1).padStart(
                  2,
                  '0'
                )}{' '}
                <span className="text-muted-foreground text-base font-normal">
                  / {String(steps.length).padStart(2, '0')}
                </span>
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {activeStep.title}
              </p>
            </div>
          </div>
        </header>

        {isResumable ? (
          <Alert className="border-warning/40 bg-warning/5">
            <HugeiconsIcon icon={InformationCircleIcon} />
            <AlertDescription className="flex flex-wrap items-center justify-between gap-4">
              <span>
                Finalisasi sebelumnya belum selesai. Draft
                sudah dikunci agar jurnal atau stok tidak
                terduplikasi.
              </span>
              <Button
                type="button"
                onClick={onFinalize}
                disabled={isFinalizing || isFinalized}
              >
                {isFinalizing
                  ? 'Melanjutkan…'
                  : 'Lanjutkan finalisasi'}
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {errorMessage ? (
          <Alert variant="destructive">
            <HugeiconsIcon icon={InformationCircleIcon} />
            <AlertDescription>
              {errorMessage}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="overflow-x-auto pb-1">
          <Stepper
            steps={stepperSteps}
            currentStep={currentStepIndex}
            onStepChange={
              isBusy
                ? undefined
                : (index) =>
                    index <= currentStepIndex &&
                    steps[index] &&
                    onStepChange(steps[index].key)
            }
          />
        </div>

        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="bg-background/60 border-b">
              <div className="flex items-center gap-3">
                <span className="bg-primary/10 text-primary grid size-11 shrink-0 place-items-center rounded-xl">
                  <HugeiconsIcon
                    icon={activeStep.icon}
                    size={22}
                  />
                </span>
                <div className="min-w-0">
                  <CardTitle>{activeStep.title}</CardTitle>
                  <CardDescription>
                    {activeStep.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="grid min-w-0 gap-7 p-5 sm:p-8">
              {step === 'start' ? (
                <div className="grid min-w-0 gap-6">
                  <div className="grid min-w-0 gap-5 md:grid-cols-[14rem_minmax(14rem,1fr)]">
                    <form.AppField
                      name="cut_off_date"
                      children={(field) => (
                        <field.DateField
                          label="Tanggal saldo awal"
                          description="Tanggal yang menggambarkan kondisi saldo dan stok yang Anda masukkan."
                          valueType="string"
                          required
                          clearable={false}
                          className="min-w-0"
                          buttonClassName="w-full"
                          calendarProps={{
                            disabled: { after: new Date() },
                          }}
                        />
                      )}
                    />
                    <form.AppField
                      name="calendar_timezone"
                      children={(field) => (
                        <field.SelectField
                          label="Zona waktu kalender Finance"
                          description="Menentukan bulan untuk periode dan laporan Finance."
                          placeholder="Pilih zona waktu"
                          items={FINANCE_CALENDAR_TIMEZONE_OPTIONS.map(
                            (option) => ({
                              label: option.label,
                              value: option.value,
                            })
                          )}
                          className="min-w-0"
                        />
                      )}
                    />
                  </div>
                  <div className="grid min-w-0 gap-5">
                    <form.AppField
                      name="description"
                      children={(field) => (
                        <field.TextField
                          label="Catatan (opsional)"
                          placeholder="Contoh: Saldo awal saat mulai memakai Finance"
                          maxLength={240}
                          className="min-w-0"
                        />
                      )}
                    />
                  </div>

                  {values.cut_off_date &&
                  values.cut_off_date <
                    getTodayDateInputValue(
                      values.calendar_timezone
                    ) ? (
                    <Alert className="border-warning/40 bg-warning/5">
                      <HugeiconsIcon
                        icon={InformationCircleIcon}
                      />
                      <AlertDescription>
                        Tanggal lampau diperbolehkan. Order
                        lama tidak otomatis dicatat sebagai
                        jurnal Finance; pastikan saldo awal
                        tidak menghitung transaksi yang sama
                        dua kali.
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="grid min-w-0 gap-3 md:grid-cols-2">
                    <ModeOption
                      active={values.mode === 'entered'}
                      title="Masukkan saldo awal"
                      description="Catat saldo yang memang sudah dimiliki bisnis pada tanggal tersebut."
                      onClick={() => {
                        form.setFieldValue(
                          'mode',
                          'entered'
                        );
                        onModeChange('entered');
                      }}
                    />
                    <ModeOption
                      active={values.mode === 'zero'}
                      title="Mulai dari nol"
                      description="Aktifkan Finance tanpa jurnal atau stok awal."
                      onClick={() => {
                        form.setFieldValue('mode', 'zero');
                        onModeChange('zero');
                      }}
                    />
                  </div>

                  <Alert>
                    <HugeiconsIcon
                      icon={InformationCircleIcon}
                    />
                    <AlertDescription>
                      Finance tidak mengubah Orders,
                      Products, atau Reports. Order lama
                      juga tidak otomatis diposting saat
                      onboarding.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : null}

              {step === 'accounts' &&
              values.mode === 'entered' ? (
                <div className="grid min-w-0 gap-6">
                  <SectionHeading
                    title="Saldo uang yang tersedia"
                    description="Isi saldo pada tanggal saldo awal. Biarkan 0 atau kosong jika akun belum memiliki saldo."
                  />

                  <div className="grid min-w-0 gap-3">
                    {setup.options.cash_bank_accounts
                      .length === 0 ? (
                      <EmptyHint>
                        Belum ada akun Kas, Bank, E-wallet,
                        atau Saldo Marketplace yang dapat
                        dipakai.
                      </EmptyHint>
                    ) : (
                      setup.options.cash_bank_accounts.map(
                        (account) => {
                          const lineIndex =
                            values.cash_bank_lines.findIndex(
                              (line) =>
                                line.account_id ===
                                account.id
                            );
                          if (lineIndex < 0) return null;

                          return (
                            <div
                              key={account.id}
                              className="bg-muted/20 grid min-w-0 gap-3 rounded-xl border p-4 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-center"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-medium">
                                  {account.name}
                                </p>
                                <p className="text-muted-foreground mt-1 text-xs">
                                  {account.code} ·{' '}
                                  {account.subtype
                                    ? (FINANCE_CASH_BANK_SUBTYPE_LABELS[
                                        account.subtype as keyof typeof FINANCE_CASH_BANK_SUBTYPE_LABELS
                                      ] ?? account.subtype)
                                    : 'Akun aset'}
                                </p>
                              </div>
                              <form.AppField
                                name={
                                  `cash_bank_lines[${lineIndex}].amount` as const
                                }
                                children={(field) => (
                                  <field.MoneyField
                                    aria-label={`Saldo ${account.name}`}
                                    label="Saldo pada tanggal tersebut"
                                    inputMode="numeric"
                                    min={0}
                                    className="min-w-0"
                                    disabled={isBusy}
                                  />
                                )}
                              />
                            </div>
                          );
                        }
                      )
                    )}
                  </div>

                  <Card className="bg-muted/10 min-w-0">
                    <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">
                          Rekening bank
                        </CardTitle>
                        <CardDescription>
                          Tambahkan rekening bisnis satu per
                          satu. Nomor lengkap tidak perlu
                          dimasukkan.
                        </CardDescription>
                      </div>
                      {!isAddingBankAccount ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={onStartAddBankAccount}
                          disabled={isBusy}
                        >
                          Tambah rekening
                        </Button>
                      ) : null}
                    </CardHeader>
                    {isAddingBankAccount &&
                    bankAccountForm ? (
                      <CardContent>
                        <FinanceBankAccountForm
                          form={bankAccountForm}
                          isSubmitting={
                            isCreatingBankAccount
                          }
                          onCancel={onCancelAddBankAccount}
                        />
                      </CardContent>
                    ) : null}
                  </Card>

                  <Alert>
                    <HugeiconsIcon
                      icon={InformationCircleIcon}
                    />
                    <AlertDescription>
                      Saldo marketplace yang belum
                      ditransfer dicatat pada akun Saldo
                      Marketplace, bukan sebagai saldo bank.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : null}

              {step === 'inventory' &&
              values.mode === 'entered' ? (
                <div className="grid min-w-0 gap-5">
                  <SectionHeading
                    title="Stok pada tanggal saldo awal"
                    description="Masukkan kuantitas dan harga perolehan, bukan harga jual. Jika belum siap, Anda boleh melewati bagian ini."
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      disabled={
                        preparableProductCount === null ||
                        preparableProductCount === 0 ||
                        isLoadingProductCount ||
                        isPreparingProducts ||
                        isRefreshingInventory ||
                        isBusy
                      }
                      onClick={onPrepareProducts}
                    >
                      {isPreparingProducts ||
                      isLoadingProductCount ? (
                        <Spinner data-icon="inline-start" />
                      ) : null}
                      {isPreparingProducts
                        ? 'Menyiapkan…'
                        : isLoadingProductCount
                          ? 'Memuat produk…'
                          : preparableProductCount === null
                            ? 'Jumlah produk tidak tersedia'
                            : `Siapkan ${preparableProductCount} produk`}
                    </Button>
                    <Link
                      href="/dashboard/finance/inventory/setup"
                      className={buttonVariants({
                        variant: 'outline',
                      })}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Kelola mapping
                    </Link>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={
                        isRefreshingInventory || isBusy
                      }
                      onClick={onRefreshInventory}
                    >
                      {isRefreshingInventory
                        ? 'Memuat pilihan…'
                        : 'Muat ulang pilihan'}
                    </Button>
                  </div>
                  {productCountError ? (
                    <p
                      className="text-destructive text-sm"
                      role="status"
                    >
                      {productCountError} Klik “Muat ulang
                      pilihan” untuk mencoba lagi.
                    </p>
                  ) : null}

                  {setup.options.inventory_items.length ===
                    0 ||
                  setup.options.locations.length === 0 ? (
                    <EmptyHint>
                      Item inventory dan lokasi belum siap.
                      Buat keduanya jika ingin mencatat stok
                      awal sekarang; jika tidak, Anda dapat
                      lanjut tanpa mengisi stok awal.
                    </EmptyHint>
                  ) : null}

                  <form.AppField
                    name="inventory_lines"
                    mode="array"
                    children={(arrayField) => (
                      <div className="grid min-w-0 gap-4">
                        {arrayField.state.value.map(
                          (line, index) => {
                            const item =
                              setup.options.inventory_items.find(
                                (option) =>
                                  option.id ===
                                  line.inventory_item_id
                              );

                            return (
                              <div
                                key={line.line_key}
                                className="bg-muted/20 grid min-w-0 gap-4 rounded-xl border p-4 sm:p-5"
                              >
                                <div className="flex min-w-0 items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="font-medium">
                                      Item {index + 1}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                      Kuantitas dan nilai
                                      persediaan.
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    aria-label={`Hapus item ${index + 1}`}
                                    disabled={isBusy}
                                    onClick={() =>
                                      arrayField.removeValue(
                                        index
                                      )
                                    }
                                  >
                                    Hapus
                                  </Button>
                                </div>
                                <FieldGroup className="grid min-w-0 gap-4 md:grid-cols-3">
                                  <div className="min-w-0 md:col-span-3">
                                    <form.AppField
                                      name={
                                        `inventory_lines[${index}].inventory_item_id` as const
                                      }
                                      children={(field) => (
                                        <field.SelectField
                                          label="Item inventory"
                                          placeholder="Pilih item"
                                          className="min-w-0"
                                          disabled={isBusy}
                                          items={getEligibleInventoryItems(
                                            setup
                                          ).map(
                                            (option) => ({
                                              value:
                                                option.id,
                                              label: `${option.sku} — ${option.name}`,
                                            })
                                          )}
                                        />
                                      )}
                                    />
                                  </div>
                                  <form.AppField
                                    name={
                                      `inventory_lines[${index}].location_id` as const
                                    }
                                    children={(field) => (
                                      <field.SelectField
                                        label="Lokasi"
                                        placeholder="Pilih lokasi"
                                        className="min-w-0"
                                        disabled={isBusy}
                                        items={setup.options.locations.map(
                                          (location) => ({
                                            value:
                                              location.id,
                                            label: `${location.code} — ${location.name}`,
                                          })
                                        )}
                                      />
                                    )}
                                  />
                                  <form.AppField
                                    name={
                                      `inventory_lines[${index}].quantity` as const
                                    }
                                    children={(field) => (
                                      <field.TextField
                                        label={`Jumlah${item ? ` (${item.unit})` : ''}`}
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        max={1_000_000}
                                        step={1}
                                        placeholder="0"
                                        className="min-w-0"
                                        disabled={isBusy}
                                      />
                                    )}
                                  />
                                  <form.AppField
                                    name={
                                      `inventory_lines[${index}].unit_cost` as const
                                    }
                                    children={(field) => (
                                      <field.MoneyField
                                        label="Harga per unit"
                                        inputMode="numeric"
                                        min={0}
                                        placeholder="0"
                                        className="min-w-0"
                                        disabled={isBusy}
                                      />
                                    )}
                                  />
                                </FieldGroup>
                              </div>
                            );
                          }
                        )}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-muted-foreground text-xs">
                            {arrayField.state.value
                              .length === 0
                              ? 'Belum ada stok awal yang ditambahkan.'
                              : `${arrayField.state.value.length} baris stok awal`}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={
                              isBusy ||
                              getEligibleInventoryItems(
                                setup
                              ).length === 0 ||
                              setup.options.locations
                                .length === 0
                            }
                            onClick={() =>
                              arrayField.pushValue(
                                emptyInventoryLine(setup)
                              )
                            }
                          >
                            Tambah item stok
                          </Button>
                        </div>
                      </div>
                    )}
                  />
                </div>
              ) : null}

              {step === 'liabilities' &&
              values.mode === 'entered' ? (
                <div className="grid min-w-0 gap-8">
                  <OpeningSubledgerSection
                    form={form}
                    fieldName="payable_lines"
                    title="Utang supplier"
                    description="Isi utang yang masih ada pada tanggal saldo awal. Gunakan satu baris per supplier, atau isi referensi jika hanya mengetahui totalnya."
                    accounts={
                      setup.options.liability_accounts
                    }
                    counterpartyLabel="Nama supplier / pihak"
                    addLabel="Tambah utang"
                    emptyLabel="Akun utang belum tersedia di Chart of Accounts."
                    isDisabled={isBusy}
                  />

                  <OpeningSubledgerSection
                    form={form}
                    fieldName="payable_lines"
                    title="Utang PayLater/Kartu Kredit (opsional)"
                    description="Masukkan saldo yang masih terutang kepada penyedia PayLater atau kartu kredit pada tanggal saldo awal. Satu baris per penyedia."
                    accounts={
                      setup.options.credit_payable_accounts
                    }
                    counterpartyLabel="Nama bank / penyedia"
                    addLabel="Tambah utang PayLater"
                    emptyLabel="Akun PayLater/Kartu Kredit belum tersedia di Chart of Accounts."
                    isDisabled={isBusy}
                  />

                  <Separator />

                  <OpeningSubledgerSection
                    form={form}
                    fieldName="receivable_lines"
                    title="Piutang (opsional)"
                    description="Masukkan piutang yang ingin dilacak dan diselesaikan melalui Finance."
                    accounts={
                      setup.options.receivable_accounts
                    }
                    counterpartyLabel="Nama pelanggan / pihak"
                    addLabel="Tambah piutang"
                    emptyLabel="Akun piutang belum tersedia di Chart of Accounts."
                    isDisabled={isBusy}
                  />

                  <Separator />

                  <section className="grid min-w-0 gap-4">
                    <SectionHeading
                      title="Modal pemilik"
                      description="Masukkan modal yang diketahui. Saldo laba akan dihitung otomatis sebagai penyeimbang saldo awal."
                    />
                    <FieldGroup className="grid min-w-0 gap-4 sm:grid-cols-2">
                      <form.AppField
                        name="owner_capital_account_id"
                        children={(field) => (
                          <field.SelectField
                            label="Akun modal"
                            placeholder="Pilih akun modal"
                            className="min-w-0"
                            disabled={isBusy}
                            items={setup.options.equity_accounts.map(
                              (account) => ({
                                value: account.id,
                                label: `${account.code} — ${account.name}`,
                              })
                            )}
                          />
                        )}
                      />
                      <form.AppField
                        name="owner_capital_amount"
                        children={(field) => (
                          <field.MoneyField
                            label="Modal yang ingin dicatat"
                            description="Masukkan 0 jika belum ingin mengisi modal pemilik."
                            inputMode="numeric"
                            min={0}
                            className="min-w-0"
                            disabled={isBusy}
                          />
                        )}
                      />
                    </FieldGroup>
                    {setup.options.equity_accounts
                      .length === 0 ? (
                      <EmptyHint>
                        Akun modal belum tersedia di Chart
                        of Accounts.
                      </EmptyHint>
                    ) : null}
                  </section>
                </div>
              ) : null}

              {step === 'review' ? (
                <div className="grid min-w-0 gap-5">
                  <SectionHeading
                    title="Periksa sebelum Finance diaktifkan"
                    description="Preview akan menampilkan jurnal dan pergerakan stok yang dibuat dari saldo awal ini."
                  />

                  <Alert>
                    <HugeiconsIcon
                      icon={InformationCircleIcon}
                    />
                    <AlertDescription>
                      Saldo awal adalah snapshot pada
                      tanggal yang dipilih. Order lama tidak
                      otomatis diposting menjadi jurnal.
                    </AlertDescription>
                  </Alert>

                  {!preview ? (
                    <Button
                      type="button"
                      onClick={onPreview}
                      disabled={isBusy}
                    >
                      {isSaving
                        ? 'Menyimpan draft…'
                        : isPreviewing
                          ? 'Memvalidasi…'
                          : 'Lihat preview'}
                    </Button>
                  ) : (
                    <OpeningBalancePreview
                      preview={preview}
                      confirmed={confirmed}
                      onConfirmedChange={onConfirmedChange}
                      onFinalize={onFinalize}
                      isFinalizing={isFinalizing}
                      isFinalized={isFinalized}
                    />
                  )}
                </div>
              ) : null}

              {successMessage ? (
                <Alert className="border-success/40 bg-success/5">
                  <AlertDescription>
                    {successMessage}
                  </AlertDescription>
                </Alert>
              ) : null}
            </CardContent>

            {!isResumable ? (
              <CardFooter className="bg-background/60 flex flex-wrap items-center justify-between gap-3 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={changeToPreviousStep}
                  disabled={
                    currentStepIndex === 0 || isBusy
                  }
                >
                  <HugeiconsIcon
                    icon={ArrowLeft02Icon}
                    data-icon="inline-start"
                  />
                  Kembali
                </Button>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  {step !== 'review' ? (
                    <Button
                      type="button"
                      onClick={onSaveAndContinue}
                      disabled={
                        currentStepIndex >=
                          steps.length - 1 || isBusy
                      }
                    >
                      {isSaving
                        ? 'Menyimpan…'
                        : 'Simpan & Lanjutkan'}
                      <HugeiconsIcon
                        icon={ArrowRight02Icon}
                        data-icon="inline-end"
                      />
                    </Button>
                  ) : preview ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onPreview}
                      disabled={isBusy}
                    >
                      {isPreviewing
                        ? 'Memperbarui…'
                        : 'Perbarui preview'}
                    </Button>
                  ) : null}
                </div>
              </CardFooter>
            ) : null}
          </Card>

          <Card className="h-fit xl:sticky xl:top-6">
            <CardHeader>
              <CardTitle>Ringkasan saldo</CardTitle>
              <CardDescription>
                Estimasi dari isian saat ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <SummaryRow
                label="Kas, bank & saldo"
                value={cashBankTotal}
              />
              <SummaryRow
                label="Persediaan"
                value={inventoryTotal}
              />
              <SummaryRow
                label="Piutang"
                value={receivableTotal}
              />
              <SummaryRow
                label="Total aset"
                value={
                  cashBankTotal +
                  inventoryTotal +
                  receivableTotal
                }
                strong
              />
              <Separator />
              <SummaryRow
                label="Utang"
                value={payableTotal}
              />
              <SummaryRow
                label="Modal pemilik"
                value={capitalTotal}
              />
              <SummaryRow
                label="Saldo laba otomatis"
                value={retainedTotal}
                tone={
                  retainedTotal < 0 ? 'warning' : 'default'
                }
              />
              <p className="text-muted-foreground pt-2 text-xs leading-5">
                Nilai ini perkiraan. Preview server adalah
                hasil validasi akhir sebelum jurnal dibuat.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  },
});

function OpeningSubledgerSection({
  form,
  fieldName,
  title,
  description,
  accounts,
  counterpartyLabel,
  addLabel,
  emptyLabel,
  isDisabled,
}: {
  form: ComponentProps<
    typeof FinanceOpeningBalanceForm
  >['form'];
  fieldName: 'payable_lines' | 'receivable_lines';
  title: string;
  description: string;
  accounts: FinanceOpeningBalanceSetupResponseDTO['options']['liability_accounts'];
  counterpartyLabel: string;
  addLabel: string;
  emptyLabel: string;
  isDisabled: boolean;
}) {
  return (
    <section className="grid min-w-0 gap-4">
      <SectionHeading
        title={title}
        description={description}
      />
      {accounts.length === 0 ? (
        <EmptyHint>{emptyLabel}</EmptyHint>
      ) : (
        <form.AppField
          name={fieldName}
          mode="array"
          children={(arrayField) => (
            <div className="grid min-w-0 gap-4">
              {arrayField.state.value.map((line, index) => {
                if (
                  !accounts.some(
                    (account) =>
                      account.id === line.account_id
                  )
                ) {
                  return null;
                }

                return (
                  <div
                    key={line.line_key}
                    className="bg-muted/20 grid min-w-0 gap-4 rounded-xl border p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">
                        {title.startsWith('Utang')
                          ? 'Utang'
                          : 'Piutang'}{' '}
                        {index + 1}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isDisabled}
                        onClick={() =>
                          arrayField.removeValue(index)
                        }
                      >
                        Hapus
                      </Button>
                    </div>
                    <FieldGroup className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <form.AppField
                        name={
                          `${fieldName}[${index}].account_id` as const
                        }
                        children={(field) => (
                          <field.SelectField
                            label="Akun"
                            placeholder="Pilih akun"
                            className="min-w-0"
                            disabled={isDisabled}
                            items={accounts.map(
                              (account) => ({
                                value: account.id,
                                label: `${account.code} — ${account.name}`,
                              })
                            )}
                          />
                        )}
                      />
                      <form.AppField
                        name={
                          `${fieldName}[${index}].amount` as const
                        }
                        children={(field) => (
                          <field.MoneyField
                            label="Jumlah"
                            inputMode="numeric"
                            min={0}
                            className="min-w-0"
                            disabled={isDisabled}
                          />
                        )}
                      />
                      <form.AppField
                        name={
                          `${fieldName}[${index}].counterparty` as const
                        }
                        children={(field) => (
                          <field.TextField
                            label={counterpartyLabel}
                            maxLength={160}
                            className="min-w-0"
                            disabled={isDisabled}
                          />
                        )}
                      />
                      <form.AppField
                        name={
                          `${fieldName}[${index}].reference` as const
                        }
                        children={(field) => (
                          <field.TextField
                            label="Referensi (opsional)"
                            maxLength={160}
                            className="min-w-0"
                            disabled={isDisabled}
                          />
                        )}
                      />
                    </FieldGroup>
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                className="justify-self-start"
                disabled={isDisabled}
                onClick={() =>
                  arrayField.pushValue({
                    line_key: crypto.randomUUID(),
                    account_id: accounts[0]?.id ?? '',
                    amount: '',
                    counterparty: '',
                    reference: '',
                  })
                }
              >
                {addLabel}
              </Button>
            </div>
          )}
        />
      )}
    </section>
  );
}

function OpeningBalancePreview({
  preview,
  confirmed,
  onConfirmedChange,
  onFinalize,
  isFinalizing,
  isFinalized,
}: {
  preview: FinanceOpeningBalancePreviewDTO;
  confirmed: boolean;
  onConfirmedChange: (confirmed: boolean) => void;
  onFinalize: () => void;
  isFinalizing: boolean;
  isFinalized: boolean;
}) {
  return (
    <div className="grid min-w-0 gap-5">
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle>Preview jurnal saldo awal</CardTitle>
          <CardDescription>
            Per tanggal {preview.cut_off_date}. Setelah
            dikonfirmasi, jurnal dan pergerakan persediaan
            tidak dapat diedit langsung.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <PreviewMetric
              label="Total debit"
              value={formatMoney(preview.total_debit)}
            />
            <PreviewMetric
              label="Total kredit"
              value={formatMoney(preview.total_credit)}
            />
            <PreviewMetric
              label="Pergerakan stok"
              value={String(
                preview.inventory_movement_count
              )}
            />
            <PreviewMetric
              label="Item utang / piutang"
              value={String(
                preview.payable_item_count +
                  preview.receivable_item_count
              )}
            />
          </div>

          {preview.will_create_journal ? (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[38rem] text-sm">
                <thead className="bg-muted/40 text-muted-foreground text-left text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3">Akun</th>
                    <th className="px-4 py-3">
                      Keterangan
                    </th>
                    <th className="px-4 py-3 text-right">
                      Debit
                    </th>
                    <th className="px-4 py-3 text-right">
                      Kredit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {preview.journal_lines.map((line) => (
                    <tr key={line.account_id}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs">
                          {line.account_code}
                        </span>{' '}
                        {line.account_name}
                      </td>
                      <td className="text-muted-foreground px-4 py-3">
                        {line.description}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {line.debit
                          ? formatMoney(line.debit)
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {line.credit
                          ? formatMoney(line.credit)
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Alert>
              <HugeiconsIcon icon={InformationCircleIcon} />
              <AlertDescription>
                {preview.mode === 'zero'
                  ? 'Mulai dari nol tidak membuat jurnal atau pergerakan persediaan.'
                  : 'Semua saldo awal yang dimasukkan bernilai nol. Finance akan diaktifkan tanpa membuat jurnal saldo awal atau pergerakan persediaan. Rekening yang telah disiapkan tetap tersedia.'}
              </AlertDescription>
            </Alert>
          )}

          {preview.inventory_movements.length > 0 ? (
            <section className="grid min-w-0 gap-3">
              <SectionHeading
                title="Stok yang akan dicatat"
                description="Periksa item, lokasi, kuantitas, dan nilai perolehan."
              />
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[36rem] text-sm">
                  <thead className="bg-muted/40 text-muted-foreground text-left text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Lokasi</th>
                      <th className="px-4 py-3 text-right">
                        Jumlah
                      </th>
                      <th className="px-4 py-3 text-right">
                        Nilai
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {preview.inventory_movements.map(
                      (movement, index) => (
                        <tr
                          key={`${movement.inventory_item_id}:${movement.location_id}:${index}`}
                        >
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs">
                              {movement.sku}
                            </span>{' '}
                            {movement.item_name}
                          </td>
                          <td className="px-4 py-3">
                            {movement.location_name}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {movement.quantity}{' '}
                            {movement.unit}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {formatMoney(
                              movement.total_cost
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {preview.subledger_items.length > 0 ? (
            <section className="grid gap-3">
              <SectionHeading
                title="Utang dan piutang"
                description="Saldo per pihak yang akan tersedia untuk ditinjau di Finance."
              />
              <div className="divide-y rounded-xl border">
                {preview.subledger_items.map(
                  (item, index) => (
                    <div
                      key={`${item.balance_type}:${index}`}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                    >
                      <span>
                        <Badge
                          variant={
                            item.balance_type === 'payable'
                              ? 'warning'
                              : 'info'
                          }
                        >
                          {item.balance_type === 'payable'
                            ? 'Utang'
                            : 'Piutang'}
                        </Badge>{' '}
                        {item.source_label}
                      </span>
                      <span className="font-mono font-medium">
                        {formatMoney(item.amount)}
                      </span>
                    </div>
                  )
                )}
              </div>
            </section>
          ) : null}

          <div className="border-border flex items-start gap-3 rounded-xl border p-4 text-sm leading-6">
            <Checkbox
              id="finance-opening-balance-confirmation"
              checked={confirmed}
              disabled={isFinalized || isFinalizing}
              onCheckedChange={(value) =>
                onConfirmedChange(value === true)
              }
              className="mt-1"
            />
            <label htmlFor="finance-opening-balance-confirmation">
              Saya sudah memeriksa tanggal dan saldo.
              Aktifkan Finance dengan saldo awal ini.
            </label>
          </div>
          <Button
            type="button"
            onClick={onFinalize}
            disabled={
              !confirmed || isFinalizing || isFinalized
            }
          >
            {isFinalizing
              ? 'Mengaktifkan Finance…'
              : 'Konfirmasi dan aktifkan Finance'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ModeOption({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        'rounded-xl border p-4 text-left transition-colors',
        active
          ? 'border-primary bg-primary/5 ring-primary/20 ring-2'
          : 'border-border hover:bg-muted/40'
      )}
      aria-pressed={active}
      onClick={onClick}
    >
      <p className="font-semibold">{title}</p>
      <p className="text-muted-foreground mt-1 text-sm leading-5">
        {description}
      </p>
    </button>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="min-w-0">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1 text-sm leading-5">
        {description}
      </p>
    </div>
  );
}

function EmptyHint({ children }: { children: string }) {
  return (
    <Alert>
      <HugeiconsIcon icon={InformationCircleIcon} />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

function PreviewMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-muted/30 min-w-0 rounded-xl border p-4">
      <p className="text-muted-foreground text-xs">
        {label}
      </p>
      <p className="mt-2 font-mono text-lg font-semibold break-words">
        {value}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
  tone = 'default',
}: {
  label: string;
  value: number;
  strong?: boolean;
  tone?: 'default' | 'warning';
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span
        className={cn(
          'text-muted-foreground min-w-0',
          strong && 'text-foreground font-semibold'
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'shrink-0 font-mono',
          strong && 'font-semibold',
          tone === 'warning' && 'text-warning'
        )}
      >
        {formatMoney(value)}
      </span>
    </div>
  );
}

function getEligibleInventoryItems(
  setup: FinanceOpeningBalanceSetupResponseDTO
) {
  return setup.options.inventory_items.filter(
    (item) =>
      item.item_type !== 'fixed_asset' &&
      item.track_quantity &&
      item.track_value
  );
}

function emptyInventoryLine(
  setup: FinanceOpeningBalanceSetupResponseDTO
) {
  return {
    line_key: crypto.randomUUID(),
    inventory_item_id:
      getEligibleInventoryItems(setup)[0]?.id ?? '',
    location_id: setup.options.locations[0]?.id ?? '',
    quantity: '',
    unit_cost: '',
  };
}

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function formatMoney(value: number) {
  return `Rp ${formatNumber(value, 3)}`;
}
