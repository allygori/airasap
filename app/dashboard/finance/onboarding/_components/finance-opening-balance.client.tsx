'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { revalidateLogic } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useAppForm } from '@/components/form/form.hook';
import { Card, CardContent } from '@/components/ui/card';
import {
  FinanceBankAccountCreateInputSchema,
  FinanceBankAccountCreateResponseSchema,
  FinanceEWalletAccountCreateInputSchema,
  FinanceEWalletAccountCreateResponseSchema,
  FinanceOpeningBalanceSaveInputSchema,
  FinanceOpeningBalanceFinalizeResponseSchema,
  FinanceOpeningBalancePreviewSchema,
  FinanceOpeningBalanceSetupResponseSchema,
  FinanceInventorySetupActionResponseSchema,
  FinanceInventorySetupResponseSchema,
  type FinanceBankAccountCreateInputDTO,
  type FinanceEWalletAccountCreateInputDTO,
  type FinanceOpeningBalanceSaveInputDTO,
  type FinanceOpeningBalancePreviewDTO,
  type FinanceOpeningBalanceSetupResponseDTO,
  type FinanceOpeningBalanceFinalizeResponseDTO,
} from '@/modules/finance/client';
import {
  createEmptyFinanceOpeningBalanceFormValues,
  createFinanceOpeningBalanceFormValues,
  getFinanceOpeningBalanceSteps,
  parseFinanceOpeningBalanceMode,
  parseFinanceOpeningBalanceStep,
  resolveFinanceOpeningBalanceStep,
  buildFinanceOpeningBalanceHref,
  isResumableFinanceOpeningBalanceDraft,
  numberValue,
  FinanceOpeningBalanceFormValuesSchema,
  type FinanceOpeningBalanceMode,
  type FinanceOpeningBalanceFormValues,
  type FinanceOpeningBalanceStep,
} from './steps/shared/finance-opening-balance.utils';
import { FinanceOpeningBalanceForm } from './finance-opening-balance.form';
import { FinanceEWalletAccountForm } from './finance-e-wallet-account.form';
import { Spinner } from '@/components/ui/spinner';

type FinanceOpeningBalanceClientProps = {
  enabled: boolean;
  onFinalized: (
    result: FinanceOpeningBalanceFinalizeResponseDTO
  ) => void;
};

type SubmitIntent = 'continue' | 'preview';

export default function FinanceOpeningBalanceClient({
  enabled,
  onFinalized,
}: FinanceOpeningBalanceClientProps) {
  const router = useRouter();
  const submitIntentRef = useRef<SubmitIntent>('continue');
  const [setup, setSetup] =
    useState<FinanceOpeningBalanceSetupResponseDTO | null>(
      null
    );
  const [isLoading, setIsLoading] = useState(enabled);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshingInventory, setIsRefreshingInventory] =
    useState(false);
  const [
    preparableProductCount,
    setPreparableProductCount,
  ] = useState<number | null>(null);
  const [isLoadingProductCount, setIsLoadingProductCount] =
    useState(enabled);
  const [isPreparingProducts, setIsPreparingProducts] =
    useState(false);
  const [productCountError, setProductCountError] =
    useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCreatingBankAccount, setIsCreatingBankAccount] =
    useState(false);
  const [
    isCreatingEWalletAccount,
    setIsCreatingEWalletAccount,
  ] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isAddingBankAccount, setIsAddingBankAccount] =
    useState(false);
  const [
    isAddingEWalletAccount,
    setIsAddingEWalletAccount,
  ] = useState(false);
  const [currentStep, setCurrentStep] =
    useState<FinanceOpeningBalanceStep>('start');
  const [preview, setPreview] =
    useState<FinanceOpeningBalancePreviewDTO | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);
  const [successMessage, setSuccessMessage] = useState<
    string | null
  >(null);

  const updateStepUrl = (
    mode: FinanceOpeningBalanceMode,
    step: FinanceOpeningBalanceStep,
    replace = false
  ) => {
    if (typeof window !== 'undefined') {
      const href = buildFinanceOpeningBalanceHref(
        window.location.pathname,
        window.location.search,
        mode,
        step
      );
      const currentHref = `${window.location.pathname}${window.location.search}`;
      if (href !== currentHref) {
        window.history[
          replace ? 'replaceState' : 'pushState'
        ](null, '', href);
      }
    }
    setCurrentStep(step);
  };

  const refreshProductPreparationCount =
    useCallback(async () => {
      setIsLoadingProductCount(true);
      setProductCountError(null);

      try {
        const response = await fetch(
          '/api/v1/dashboard/finance/inventory/setup?page=1&limit=50',
          { cache: 'no-store' }
        );
        const payload: unknown = await response.json();
        const parsed =
          FinanceInventorySetupResponseSchema.safeParse(
            getSuccessData(payload)
          );

        if (!response.ok || !parsed.success) {
          setPreparableProductCount(null);
          setProductCountError(
            getErrorMessage(payload) ??
              'Jumlah produk belum dapat dihitung.'
          );
          return;
        }

        setPreparableProductCount(
          parsed.data.product_options.filter(
            (product) => !product.mapped_inventory_item
          ).length
        );
      } catch {
        setPreparableProductCount(null);
        setProductCountError(
          'Jumlah produk belum dapat dihitung. Periksa koneksi lalu coba lagi.'
        );
      } finally {
        setIsLoadingProductCount(false);
      }
    }, []);

  useEffect(() => {
    if (!enabled) return;

    const loadProductCount = async () => {
      await refreshProductPreparationCount();
    };

    void loadProductCount();
  }, [enabled, refreshProductPreparationCount]);

  const saveDraft = async (
    values: FinanceOpeningBalanceFormValues
  ): Promise<boolean> => {
    setErrorMessage(null);
    setSuccessMessage(null);

    setIsSaving(true);
    try {
      const payload: FinanceOpeningBalanceSaveInputDTO =
        FinanceOpeningBalanceSaveInputSchema.parse({
          cut_off_date: values.cut_off_date,
          calendar_timezone: values.calendar_timezone,
          mode: values.mode,
          description:
            values.description.trim() ||
            'Saldo awal Finance',
          cash_bank_lines:
            values.mode === 'entered'
              ? values.cash_bank_lines
                  .filter(
                    (line) => numberValue(line.amount) > 0
                  )
                  .map((line) => ({
                    account_id: line.account_id,
                    amount: numberValue(line.amount),
                  }))
              : [],
          inventory_lines:
            values.mode === 'entered'
              ? values.inventory_lines
                  .filter((line) =>
                    Boolean(
                      line.inventory_item_id &&
                      line.location_id
                    )
                  )
                  .map((line) => ({
                    inventory_item_id:
                      line.inventory_item_id,
                    location_id: line.location_id,
                    quantity: numberValue(line.quantity),
                    ...(line.unit_cost.trim()
                      ? {
                          unit_cost: numberValue(
                            line.unit_cost
                          ),
                        }
                      : {}),
                  }))
              : [],
          payable_lines:
            values.mode === 'entered'
              ? values.payable_lines
                  .filter(
                    (line) =>
                      numberValue(line.amount) > 0 &&
                      Boolean(line.account_id)
                  )
                  .map((line) => ({
                    account_id: line.account_id,
                    amount: numberValue(line.amount),
                    ...(line.counterparty.trim()
                      ? {
                          counterparty:
                            line.counterparty.trim(),
                        }
                      : {}),
                    ...(line.reference.trim()
                      ? { reference: line.reference.trim() }
                      : {}),
                  }))
              : [],
          receivable_lines:
            values.mode === 'entered'
              ? values.receivable_lines
                  .filter(
                    (line) =>
                      numberValue(line.amount) > 0 &&
                      Boolean(line.account_id)
                  )
                  .map((line) => ({
                    account_id: line.account_id,
                    amount: numberValue(line.amount),
                    ...(line.counterparty.trim()
                      ? {
                          counterparty:
                            line.counterparty.trim(),
                        }
                      : {}),
                    ...(line.reference.trim()
                      ? { reference: line.reference.trim() }
                      : {}),
                  }))
              : [],
          ...(values.mode === 'entered'
            ? {
                owner_capital_amount: numberValue(
                  values.owner_capital_amount
                ),
                ...(values.owner_capital_account_id
                  ? {
                      owner_capital_account_id:
                        values.owner_capital_account_id,
                    }
                  : {}),
              }
            : {}),
        });

      const response = await fetch(
        '/api/v1/dashboard/finance/onboarding/opening-balance',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const responsePayload: unknown =
        await response.json();
      const nextSetup = parseSetupResponse(responsePayload);

      if (!response.ok || !nextSetup) {
        setErrorMessage(
          getErrorMessage(responsePayload) ??
            'Draft saldo awal gagal disimpan.'
        );
        return false;
      }

      setSetup(nextSetup);
      setSuccessMessage('Draft saldo awal tersimpan.');
      return true;
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof z.ZodError
          ? (error.issues[0]?.message ??
              'Periksa kembali isian saldo awal.')
          : 'Draft saldo awal gagal disimpan. Coba lagi.'
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const loadPreview = async () => {
    setIsPreviewing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        '/api/v1/dashboard/finance/onboarding/opening-balance/preview',
        { cache: 'no-store' }
      );
      const payload: unknown = await response.json();
      const parsed = parsePreviewResponse(payload);

      if (!response.ok || !parsed) {
        setErrorMessage(
          getErrorMessage(payload) ??
            'Preview saldo awal gagal dibuat.'
        );
        return;
      }

      setPreview(parsed);
      setConfirmed(false);
      setSuccessMessage(
        'Draft tervalidasi. Periksa preview sebelum finalisasi.'
      );
    } catch {
      setErrorMessage(
        'Preview saldo awal gagal dibuat. Coba lagi.'
      );
    } finally {
      setIsPreviewing(false);
    }
  };

  const openingForm = useAppForm({
    defaultValues:
      createEmptyFinanceOpeningBalanceFormValues(),
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: FinanceOpeningBalanceFormValuesSchema,
    },
    listeners: {
      onChange: () => {
        setPreview(null);
        setConfirmed(false);
      },
    },
    onSubmit: async ({ value }) => {
      const saved = await saveDraft(value);
      if (saved) {
        if (submitIntentRef.current === 'preview') {
          await loadPreview();
        } else {
          const steps = getFinanceOpeningBalanceSteps(
            value.mode
          );
          const stepIndex = steps.findIndex(
            (item) => item.key === currentStep
          );
          const nextStep = steps[stepIndex + 1];
          if (nextStep) {
            updateStepUrl(value.mode, nextStep.key);
          }
        }
      }
      submitIntentRef.current = 'continue';
    },
  });
  const createBankAccount = async (
    values: FinanceBankAccountCreateInputDTO
  ) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsCreatingBankAccount(true);

    try {
      const body =
        FinanceBankAccountCreateInputSchema.parse(values);
      const response = await fetch(
        '/api/v1/dashboard/finance/onboarding/bank-accounts',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      const payload: unknown = await response.json();
      const result = parseBankAccountResponse(payload);

      if (!response.ok || !result) {
        setErrorMessage(
          getErrorMessage(payload) ??
            'Rekening bank gagal ditambahkan.'
        );
        return false;
      }

      const account = result.account;
      setSetup((current) =>
        current
          ? {
              ...current,
              options: {
                ...current.options,
                cash_bank_accounts:
                  current.options.cash_bank_accounts.some(
                    (option) => option.id === account.id
                  )
                    ? current.options.cash_bank_accounts
                    : [
                        ...current.options
                          .cash_bank_accounts,
                        account,
                      ],
              },
            }
          : current
      );
      openingForm.setFieldValue(
        'cash_bank_lines',
        (current) =>
          current.some(
            (line) => line.account_id === account.id
          )
            ? current
            : [
                ...current,
                { account_id: account.id, amount: '' },
              ]
      );
      setIsAddingBankAccount(false);
      setSuccessMessage(
        `${account.name} ditambahkan. Isi saldo awalnya di daftar akun.`
      );
      return true;
    } catch {
      setErrorMessage(
        'Rekening bank gagal ditambahkan. Periksa kembali isian.'
      );
      return false;
    } finally {
      setIsCreatingBankAccount(false);
    }
  };

  const createEWalletAccount = async (
    values: FinanceEWalletAccountCreateInputDTO
  ) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsCreatingEWalletAccount(true);

    try {
      const body =
        FinanceEWalletAccountCreateInputSchema.parse(
          values
        );
      const response = await fetch(
        '/api/v1/dashboard/finance/onboarding/e-wallet-accounts',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      const payload: unknown = await response.json();
      const parsed =
        FinanceEWalletAccountCreateResponseSchema.safeParse(
          getSuccessData(payload)
        );

      if (!response.ok || !parsed.success) {
        setErrorMessage(
          getErrorMessage(payload) ??
            'Akun e-wallet gagal ditambahkan.'
        );
        return false;
      }

      const account = parsed.data.account;
      setSetup((current) =>
        current
          ? {
              ...current,
              options: {
                ...current.options,
                cash_bank_accounts:
                  current.options.cash_bank_accounts.some(
                    (option) => option.id === account.id
                  )
                    ? current.options.cash_bank_accounts
                    : [
                        ...current.options
                          .cash_bank_accounts,
                        account,
                      ],
              },
            }
          : current
      );
      openingForm.setFieldValue(
        'cash_bank_lines',
        (current) =>
          current.some(
            (line) => line.account_id === account.id
          )
            ? current
            : [
                ...current,
                { account_id: account.id, amount: '' },
              ]
      );
      setIsAddingEWalletAccount(false);
      setSuccessMessage(
        `${account.name} ditambahkan sebagai akun e-wallet.`
      );
      return true;
    } catch {
      setErrorMessage(
        'Akun e-wallet gagal ditambahkan. Periksa kembali isian.'
      );
      return false;
    } finally {
      setIsCreatingEWalletAccount(false);
    }
  };

  const bankAccountForm = useAppForm({
    defaultValues: {
      institution: '',
      account_last4: '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: FinanceBankAccountCreateInputSchema,
    },
    onSubmit: async ({ value }) => {
      await createBankAccount(value);
    },
  });

  const eWalletAccountForm = useAppForm({
    defaultValues: {
      provider: '',
      account_last4: '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: FinanceEWalletAccountCreateInputSchema,
    },
    onSubmit: async ({ value }) => {
      await createEWalletAccount(value);
    },
  });

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const loadSetup = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch(
          '/api/v1/dashboard/finance/onboarding/opening-balance',
          { cache: 'no-store' }
        );
        const payload: unknown = await response.json();
        const nextSetup = parseSetupResponse(payload);

        if (!response.ok || !nextSetup) {
          if (!cancelled) {
            setErrorMessage(
              getErrorMessage(payload) ??
                'Setup saldo awal gagal dimuat.'
            );
          }
          return;
        }

        if (!cancelled) {
          setSetup(nextSetup);
          const params = new URLSearchParams(
            window.location.search
          );
          const requestedMode =
            parseFinanceOpeningBalanceMode(
              params.get('mode')
            );
          const resumable =
            isResumableFinanceOpeningBalanceDraft(
              nextSetup
            );
          const mode = resumable
            ? (nextSetup.draft?.mode ??
              requestedMode ??
              'entered')
            : (requestedMode ??
              nextSetup.draft?.mode ??
              'entered');
          const step = resolveFinanceOpeningBalanceStep(
            mode,
            parseFinanceOpeningBalanceStep(
              params.get('step')
            ),
            resumable
          );
          // Keep the hook's initial defaults so its next update won't overwrite this loaded draft.
          openingForm.reset(
            createFinanceOpeningBalanceFormValues(
              nextSetup,
              mode
            ),
            { keepDefaultValues: true }
          );
          updateStepUrl(mode, step, true);
        }
      } catch {
        if (!cancelled) {
          setErrorMessage(
            'Setup saldo awal gagal dimuat. Coba lagi.'
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadSetup();
    return () => {
      cancelled = true;
    };
  }, [enabled, openingForm]);

  useEffect(() => {
    if (!enabled || !setup) return;

    const syncFromBrowserHistory = () => {
      const params = new URLSearchParams(
        window.location.search
      );
      const resumable =
        isResumableFinanceOpeningBalanceDraft(setup);
      const mode = resumable
        ? (setup.draft?.mode ?? 'entered')
        : (parseFinanceOpeningBalanceMode(
            params.get('mode')
          ) ?? openingForm.getFieldValue('mode'));
      const step = resolveFinanceOpeningBalanceStep(
        mode,
        parseFinanceOpeningBalanceStep(params.get('step')),
        resumable
      );

      if (openingForm.getFieldValue('mode') !== mode) {
        openingForm.setFieldValue('mode', mode);
      }
      updateStepUrl(mode, step, true);
    };

    window.addEventListener(
      'popstate',
      syncFromBrowserHistory
    );
    return () => {
      window.removeEventListener(
        'popstate',
        syncFromBrowserHistory
      );
    };
  }, [enabled, openingForm, setup]);

  const refreshInventoryOptions = async () => {
    setIsRefreshingInventory(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        '/api/v1/dashboard/finance/onboarding/opening-balance',
        { cache: 'no-store' }
      );
      const payload: unknown = await response.json();
      const nextSetup = parseSetupResponse(payload);

      if (!response.ok || !nextSetup) {
        setErrorMessage(
          getErrorMessage(payload) ??
            'Pilihan inventory gagal dimuat ulang.'
        );
        return;
      }

      setSetup((current) =>
        current
          ? {
              ...current,
              options: {
                ...current.options,
                inventory_items:
                  nextSetup.options.inventory_items,
                locations: nextSetup.options.locations,
              },
            }
          : nextSetup
      );
      await refreshProductPreparationCount();
      setSuccessMessage(
        'Pilihan item dan lokasi diperbarui; isian saldo tetap tersimpan.'
      );
    } catch {
      setErrorMessage(
        'Pilihan inventory gagal dimuat ulang. Periksa koneksi lalu coba lagi.'
      );
    } finally {
      setIsRefreshingInventory(false);
    }
  };

  const prepareProductsFromOnboarding = async () => {
    setIsPreparingProducts(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        '/api/v1/dashboard/finance/inventory/setup',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'prepare_from_products',
            page: 1,
            limit: 50,
          }),
        }
      );
      const payload: unknown = await response.json();
      const parsed =
        FinanceInventorySetupActionResponseSchema.safeParse(
          getSuccessData(payload)
        );

      if (
        !response.ok ||
        !parsed.success ||
        parsed.data.action !== 'prepare_from_products'
      ) {
        setErrorMessage(
          getErrorMessage(payload) ??
            'Persiapan stok dari Produk gagal. Coba lagi.'
        );
        return;
      }

      await refreshInventoryOptions();
      setSuccessMessage(
        `${parsed.data.summary.prepared} disiapkan, ${parsed.data.summary.already_mapped} sudah terhubung, dan ${parsed.data.summary.needs_review} perlu ditinjau.`
      );
    } catch {
      setErrorMessage(
        'Persiapan stok dari Produk gagal. Periksa koneksi lalu coba lagi.'
      );
    } finally {
      setIsPreparingProducts(false);
    }
  };

  const showPreview = () => {
    submitIntentRef.current = 'preview';
    void openingForm.handleSubmit();
  };

  const saveAndContinue = () => {
    submitIntentRef.current = 'continue';
    void openingForm.handleSubmit();
  };

  const finalizeOpeningBalance = async () => {
    let completedResult: FinanceOpeningBalanceFinalizeResponseDTO | null =
      null;
    setIsFinalizing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        '/api/v1/dashboard/finance/onboarding/opening-balance/finalize',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirmed: true }),
        }
      );
      const payload: unknown = await response.json();
      const parsed = parseFinalizeResponse(payload);

      if (!response.ok || !parsed) {
        setErrorMessage(
          getErrorMessage(payload) ??
            'Finalisasi saldo awal gagal.'
        );
        return;
      }

      setFinalized(true);
      completedResult = parsed;
      setSuccessMessage(
        parsed.status === 'skipped'
          ? 'Finance aktif tanpa saldo awal.'
          : 'Finance aktif dan saldo awal sudah dicatat.'
      );
      router.refresh();
    } catch {
      setErrorMessage('Finalisasi gagal. Coba lagi.');
    } finally {
      setIsFinalizing(false);
    }

    if (completedResult) onFinalized(completedResult);
  };

  const handleModeChange = (
    mode: FinanceOpeningBalanceMode
  ) => {
    updateStepUrl(
      mode,
      mode === 'zero' ? 'accounts' : 'start'
    );
  };

  const handleStepChange = (
    step: FinanceOpeningBalanceStep
  ) => {
    updateStepUrl(openingForm.getFieldValue('mode'), step);
  };

  const startAddBankAccount = () => {
    bankAccountForm.reset();
    setErrorMessage(null);
    setIsAddingBankAccount(true);
  };

  const startAddEWalletAccount = () => {
    eWalletAccountForm.reset();
    setErrorMessage(null);
    setIsAddingEWalletAccount(true);
  };

  if (!enabled) return null;

  if (isLoading || !setup) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Card>
          <CardContent className="text-muted-foreground flex flex-col items-center justify-center py-8 text-sm">
            <Spinner className="block size-6" />
            <p>
              Memuat akun, persediaan, dan lokasi untuk
              saldo awal…
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isResumable =
    isResumableFinanceOpeningBalanceDraft(setup);

  return (
    <FinanceOpeningBalanceForm
      form={openingForm}
      setup={setup}
      step={currentStep}
      onStepChange={handleStepChange}
      onModeChange={handleModeChange}
      bankAccountForm={bankAccountForm}
      eWalletAccountForm={eWalletAccountForm}
      isAddingBankAccount={isAddingBankAccount}
      isAddingEWalletAccount={isAddingEWalletAccount}
      isCreatingBankAccount={isCreatingBankAccount}
      isCreatingEWalletAccount={isCreatingEWalletAccount}
      onStartAddBankAccount={startAddBankAccount}
      onStartAddEWalletAccount={startAddEWalletAccount}
      onCancelAddBankAccount={() =>
        setIsAddingBankAccount(false)
      }
      onCancelAddEWalletAccount={() =>
        setIsAddingEWalletAccount(false)
      }
      onRefreshInventory={() =>
        void refreshInventoryOptions()
      }
      isRefreshingInventory={isRefreshingInventory}
      preparableProductCount={preparableProductCount}
      isLoadingProductCount={isLoadingProductCount}
      isPreparingProducts={isPreparingProducts}
      productCountError={productCountError}
      onPrepareProducts={() =>
        void prepareProductsFromOnboarding()
      }
      isSaving={isSaving}
      isPreviewing={isPreviewing}
      isFinalizing={isFinalizing}
      isFinalized={finalized}
      isResumable={isResumable}
      errorMessage={errorMessage}
      successMessage={successMessage}
      preview={preview}
      confirmed={confirmed}
      onConfirmedChange={setConfirmed}
      onSaveAndContinue={saveAndContinue}
      onPreview={showPreview}
      onFinalize={() => void finalizeOpeningBalance()}
    />
  );
}

function parseSetupResponse(
  payload: unknown
): FinanceOpeningBalanceSetupResponseDTO | null {
  const parsed =
    FinanceOpeningBalanceSetupResponseSchema.safeParse(
      getSuccessData(payload)
    );
  return parsed.success ? parsed.data : null;
}

function parsePreviewResponse(
  payload: unknown
): FinanceOpeningBalancePreviewDTO | null {
  const parsed =
    FinanceOpeningBalancePreviewSchema.safeParse(
      getSuccessData(payload)
    );
  return parsed.success ? parsed.data : null;
}

function parseFinalizeResponse(payload: unknown) {
  const parsed =
    FinanceOpeningBalanceFinalizeResponseSchema.safeParse(
      getSuccessData(payload)
    );
  return parsed.success ? parsed.data : null;
}

function parseBankAccountResponse(payload: unknown) {
  const parsed =
    FinanceBankAccountCreateResponseSchema.safeParse(
      getSuccessData(payload)
    );
  return parsed.success ? parsed.data : null;
}

function getSuccessData(payload: unknown): unknown {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('success' in payload) ||
    payload.success !== true ||
    !('data' in payload)
  ) {
    return null;
  }
  return payload.data;
}

function getErrorMessage(payload: unknown): string | null {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('error' in payload) ||
    !payload.error ||
    typeof payload.error !== 'object' ||
    !('message' in payload.error) ||
    typeof payload.error.message !== 'string'
  ) {
    return null;
  }
  return payload.error.message;
}
