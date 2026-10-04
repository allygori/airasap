/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import { useStore } from '@tanstack/react-form';
import { InformationCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@/components/icons/hugeicons-icon';
import { withForm } from '@/components/form/form.hook';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FINANCE_CASH_BANK_SUBTYPE_LABELS } from '@/modules/finance/client';
import { FinanceBankAccountForm } from '../../finance-bank-account.form';
import type { FinanceBankAccountFormApi } from '../../finance-bank-account.form';
import { FinanceEWalletAccountForm } from '../../finance-e-wallet-account.form';
import type { FinanceEWalletAccountFormApi } from '../../finance-e-wallet-account.form';
import type { FinanceOpeningBalanceFormProps } from '../../finance-opening-balance.form';
import { createEmptyFinanceOpeningBalanceFormValues } from './finance-opening-balance.utils';
import { SectionHeading } from './finance-opening-balance.shared';

type AccountOption =
  FinanceOpeningBalanceFormProps['setup']['options']['cash_bank_accounts'][number];
type Props = Pick<
  FinanceOpeningBalanceFormProps,
  | 'setup'
  | 'isAddingBankAccount'
  | 'isAddingEWalletAccount'
  | 'isCreatingBankAccount'
  | 'isCreatingEWalletAccount'
  | 'bankAccountForm'
  | 'eWalletAccountForm'
  | 'onStartAddBankAccount'
  | 'onStartAddEWalletAccount'
  | 'onCancelAddBankAccount'
  | 'onCancelAddEWalletAccount'
> & { isBusy: boolean };

export const FinanceOpeningBalanceAccountsStep = withForm({
  defaultValues:
    createEmptyFinanceOpeningBalanceFormValues(),
  props: {
    setup: { options: { cash_bank_accounts: [] } },
    isBusy: false,
    isAddingBankAccount: false,
    isAddingEWalletAccount: false,
    isCreatingBankAccount: false,
    isCreatingEWalletAccount: false,
    onStartAddBankAccount: () => undefined,
    onStartAddEWalletAccount: () => undefined,
    onCancelAddBankAccount: () => undefined,
    onCancelAddEWalletAccount: () => undefined,
  } as unknown as Props,
  render: function Render({
    form,
    setup,
    isBusy,
    isAddingBankAccount,
    isAddingEWalletAccount,
    isCreatingBankAccount,
    isCreatingEWalletAccount,
    bankAccountForm,
    eWalletAccountForm,
    onStartAddBankAccount,
    onStartAddEWalletAccount,
    onCancelAddBankAccount,
    onCancelAddEWalletAccount,
  }) {
    const values = useStore(
      form.store,
      (state) => state.values
    );
    const cashAccounts =
      setup.options.cash_bank_accounts.filter(
        (account) => account.subtype === 'cash'
      );
    const bankAccounts =
      setup.options.cash_bank_accounts.filter(
        (account) => account.subtype === 'bank'
      );
    const eWalletAccounts =
      setup.options.cash_bank_accounts.filter(
        (account) => account.subtype === 'e_wallet'
      );
    const marketplaceAccounts =
      setup.options.cash_bank_accounts.filter(
        (account) =>
          account.subtype === 'marketplace_balance'
      );
    const hasReceivingAccount =
      bankAccounts.length > 0 || eWalletAccounts.length > 0;

    const renderAccountRows = (
      accounts: AccountOption[]
    ) => {
      if (accounts.length === 0) {
        return (
          <p className="text-muted-foreground px-3 py-2 text-sm">
            Belum ada akun.
          </p>
        );
      }

      return accounts.map((account) => {
        const lineIndex = values.cash_bank_lines.findIndex(
          (line) => line.account_id === account.id
        );
        const subtype = account.subtype as
          | keyof typeof FINANCE_CASH_BANK_SUBTYPE_LABELS
          | undefined;

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
                {subtype
                  ? (FINANCE_CASH_BANK_SUBTYPE_LABELS[
                      subtype
                    ] ?? account.subtype)
                  : 'Akun aset'}
              </p>
            </div>
            {values.mode === 'entered' && lineIndex >= 0 ? (
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
            ) : values.mode === 'zero' ? (
              <p className="text-muted-foreground text-sm sm:text-right">
                Saldo awal tidak diminta
              </p>
            ) : null}
          </div>
        );
      });
    };

    return (
      <div className="grid min-w-0 gap-6">
        <SectionHeading
          title={
            values.mode === 'entered'
              ? 'Kas, bank, dan e-wallet'
              : 'Siapkan akun penerimaan'
          }
          description={
            values.mode === 'entered'
              ? 'Isi saldo pada tanggal saldo awal. Kas Toko boleh dibiarkan nol; saldo bank atau e-wallet diperlukan untuk menerima payout.'
              : 'Mode mulai dari nol tidak meminta saldo awal, tetapi Finance memerlukan setidaknya satu rekening bank atau e-wallet.'
          }
        />

        {!hasReceivingAccount ? (
          <Alert>
            <HugeiconsIcon icon={InformationCircleIcon} />
            <AlertDescription>
              Tambahkan minimal satu rekening bank atau
              e-wallet agar Finance dapat diaktifkan.
            </AlertDescription>
          </Alert>
        ) : null}

        {cashAccounts.length > 0 ? (
          <Card className="bg-muted/10 min-w-0">
            <CardHeader>
              <CardTitle className="text-base">
                Kas Toko
              </CardTitle>
              <CardDescription>
                Opsional untuk uang tunai fisik usaha.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {renderAccountRows(cashAccounts)}
            </CardContent>
          </Card>
        ) : null}

        <Card className="bg-muted/10 min-w-0">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">
                Bank Operasional
              </CardTitle>
              <CardDescription>
                Rekening bank ditambahkan sebagai akun anak
                di bawah grup ini.
              </CardDescription>
            </div>
            {!isAddingBankAccount ? (
              <Button
                type="button"
                variant="outline"
                onClick={onStartAddBankAccount}
                disabled={isBusy}
              >
                Tambah rekening bank
              </Button>
            ) : null}
          </CardHeader>
          {isAddingBankAccount && bankAccountForm ? (
            <CardContent className="grid gap-4">
              <div className="ml-3 grid gap-3 border-l pl-4">
                {renderAccountRows(bankAccounts)}
              </div>
              <FinanceBankAccountForm
                form={bankAccountForm}
                isSubmitting={isCreatingBankAccount}
                onCancel={onCancelAddBankAccount}
              />
            </CardContent>
          ) : (
            <CardContent>
              <div className="ml-3 grid gap-3 border-l pl-4">
                {renderAccountRows(bankAccounts)}
              </div>
            </CardContent>
          )}
        </Card>

        <Card className="bg-muted/10 min-w-0">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">
                Saldo E-wallet
              </CardTitle>
              <CardDescription>
                Setiap dompet digital dicatat pada akun anak
                tersendiri.
              </CardDescription>
            </div>
            {!isAddingEWalletAccount ? (
              <Button
                type="button"
                variant="outline"
                onClick={onStartAddEWalletAccount}
                disabled={isBusy}
              >
                Tambah e-wallet
              </Button>
            ) : null}
          </CardHeader>
          {isAddingEWalletAccount && eWalletAccountForm ? (
            <CardContent className="grid gap-4">
              <div className="ml-3 grid gap-3 border-l pl-4">
                {renderAccountRows(eWalletAccounts)}
              </div>
              <FinanceEWalletAccountForm
                form={eWalletAccountForm}
                isSubmitting={isCreatingEWalletAccount}
                onCancel={onCancelAddEWalletAccount}
              />
            </CardContent>
          ) : (
            <CardContent>
              <div className="ml-3 grid gap-3 border-l pl-4">
                {renderAccountRows(eWalletAccounts)}
              </div>
            </CardContent>
          )}
        </Card>

        {marketplaceAccounts.length > 0 ? (
          <Card className="bg-muted/10 min-w-0">
            <CardHeader>
              <CardTitle className="text-base">
                Saldo marketplace
              </CardTitle>
              <CardDescription>
                Dana yang masih berada di marketplace tetap
                dipisahkan dari rekening bank dan e-wallet.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {renderAccountRows(marketplaceAccounts)}
            </CardContent>
          </Card>
        ) : null}

        <Alert>
          <HugeiconsIcon icon={InformationCircleIcon} />
          <AlertDescription>
            Akun pertama yang ditambahkan menjadi default
            pencatatan payout Shopee. Anda dapat mengubahnya
            setelah onboarding di Pengaturan Finance.
          </AlertDescription>
        </Alert>
      </div>
    );
  },
});
