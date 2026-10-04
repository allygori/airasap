'use client';

import type { ComponentProps } from 'react';
import { useStore } from '@tanstack/react-form';
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  InformationCircleIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@/components/icons/hugeicons-icon';
import { withForm } from '@/components/form/form.hook';
import {
  Alert,
  AlertDescription,
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
import { Separator } from '@/components/ui/separator';
import {
  Stepper,
  type StepperStep,
} from '@/components/ui/stepper';
import type { FinanceBankAccountFormApi } from './finance-bank-account.form';
import type { FinanceEWalletAccountFormApi } from './finance-e-wallet-account.form';
import {
  FINANCE_DEFAULT_CALENDAR_TIMEZONE,
  type FinanceOpeningBalancePreviewDTO,
  type FinanceOpeningBalanceSetupResponseDTO,
} from '@/modules/finance/client';
import {
  createEmptyFinanceOpeningBalanceFormValues,
  getFinanceOpeningBalanceSteps,
  numberValue,
  type FinanceOpeningBalanceFormValues,
  type FinanceOpeningBalanceStep,
} from './steps/shared/finance-opening-balance.utils';
import { SummaryRow } from './steps/shared/finance-opening-balance.shared';
import { FinanceOpeningBalanceStartStep } from './steps/shared/finance-opening-balance-start.step';
import { FinanceOpeningBalanceAccountsStep } from './steps/shared/finance-opening-balance-accounts.step';
import { FinanceOpeningBalanceReviewStep } from './steps/shared/finance-opening-balance-review.step';
import { FinanceOpeningBalanceInventoryStep } from './steps/existing-balance-mode/finance-opening-balance-inventory.step';
import { FinanceOpeningBalanceLiabilitiesStep } from './steps/existing-balance-mode/finance-opening-balance-liabilities.step';

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

export type FinanceOpeningBalanceFormProps = {
  setup: FinanceOpeningBalanceSetupResponseDTO;
  step: FinanceOpeningBalanceStep;
  onStepChange: (step: FinanceOpeningBalanceStep) => void;
  onModeChange: (
    mode: FinanceOpeningBalanceFormValues['mode']
  ) => void;
  bankAccountForm?: FinanceBankAccountFormApi;
  eWalletAccountForm?: FinanceEWalletAccountFormApi;
  isAddingBankAccount: boolean;
  isAddingEWalletAccount: boolean;
  isCreatingBankAccount: boolean;
  isCreatingEWalletAccount: boolean;
  onStartAddBankAccount: () => void;
  onStartAddEWalletAccount: () => void;
  onCancelAddBankAccount: () => void;
  onCancelAddEWalletAccount: () => void;
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
    isAddingEWalletAccount: false,
    isCreatingBankAccount: false,
    isCreatingEWalletAccount: false,
    onStartAddBankAccount: () => undefined,
    onStartAddEWalletAccount: () => undefined,
    onCancelAddBankAccount: () => undefined,
    onCancelAddEWalletAccount: () => undefined,
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
    eWalletAccountForm,
    isAddingBankAccount,
    isAddingEWalletAccount,
    isCreatingBankAccount,
    isCreatingEWalletAccount,
    onStartAddBankAccount,
    onStartAddEWalletAccount,
    onCancelAddBankAccount,
    onCancelAddEWalletAccount,
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
    const activeStep = steps[currentStepIndex] ?? steps[0];
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
      isCreatingBankAccount ||
      isCreatingEWalletAccount ||
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
                : (index) => {
                    if (
                      index <= currentStepIndex &&
                      steps[index]
                    )
                      onStepChange(steps[index].key);
                  }
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
                <FinanceOpeningBalanceStartStep
                  form={form}
                  onModeChange={onModeChange}
                />
              ) : null}
              {step === 'accounts' ? (
                <FinanceOpeningBalanceAccountsStep
                  form={form}
                  setup={setup}
                  isBusy={isBusy}
                  isAddingBankAccount={isAddingBankAccount}
                  isAddingEWalletAccount={
                    isAddingEWalletAccount
                  }
                  isCreatingBankAccount={
                    isCreatingBankAccount
                  }
                  isCreatingEWalletAccount={
                    isCreatingEWalletAccount
                  }
                  bankAccountForm={bankAccountForm}
                  eWalletAccountForm={eWalletAccountForm}
                  onStartAddBankAccount={
                    onStartAddBankAccount
                  }
                  onStartAddEWalletAccount={
                    onStartAddEWalletAccount
                  }
                  onCancelAddBankAccount={
                    onCancelAddBankAccount
                  }
                  onCancelAddEWalletAccount={
                    onCancelAddEWalletAccount
                  }
                />
              ) : null}
              {step === 'inventory' &&
              values.mode === 'entered' ? (
                <FinanceOpeningBalanceInventoryStep
                  form={form}
                  setup={setup}
                  isBusy={isBusy}
                  preparableProductCount={
                    preparableProductCount
                  }
                  isLoadingProductCount={
                    isLoadingProductCount
                  }
                  isPreparingProducts={isPreparingProducts}
                  isRefreshingInventory={
                    isRefreshingInventory
                  }
                  productCountError={productCountError}
                  onPrepareProducts={onPrepareProducts}
                  onRefreshInventory={onRefreshInventory}
                />
              ) : null}
              {step === 'liabilities' &&
              values.mode === 'entered' ? (
                <FinanceOpeningBalanceLiabilitiesStep
                  form={form}
                  setup={setup}
                  isBusy={isBusy}
                />
              ) : null}
              {step === 'review' ? (
                <FinanceOpeningBalanceReviewStep
                  form={form}
                  isBusy={isBusy}
                  isSaving={isSaving}
                  isPreviewing={isPreviewing}
                  isFinalizing={isFinalizing}
                  isFinalized={isFinalized}
                  preview={preview}
                  confirmed={confirmed}
                  onConfirmedChange={onConfirmedChange}
                  onPreview={onPreview}
                  onFinalize={onFinalize}
                />
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
                          steps.length - 1 ||
                        isBusy ||
                        (step === 'accounts' &&
                          setup.options.cash_bank_accounts.every(
                            (account) =>
                              account.subtype !== 'bank' &&
                              account.subtype !== 'e_wallet'
                          ))
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

export type FinanceOpeningBalanceFormApi = ComponentProps<
  typeof FinanceOpeningBalanceForm
>['form'];
