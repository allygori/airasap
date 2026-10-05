/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import { withForm } from '@/components/form/form.hook';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import type { FinanceCashBankAccountDTO } from '@/modules/finance/client';
import type { FinanceMarketplaceWithdrawalFormValues } from './finance-marketplace-withdrawal-form.schema';

type MarketplaceWithdrawalFormProps = {
  destinations: FinanceCashBankAccountDTO[];
  withdrawableBalance: number;
  isSubmitting: boolean;
  errorMessage: string | null;
  successMessage: string | null;
};

export function createMarketplaceWithdrawalFormDefaults(
  destinations: FinanceCashBankAccountDTO[]
): FinanceMarketplaceWithdrawalFormValues {
  const today = new Date();
  const localDate = [
    String(today.getFullYear()).padStart(4, '0'),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  return {
    destination_account_id: destinations[0]?.id ?? '',
    amount: '',
    transaction_date: localDate,
    reference: '',
    description: '',
  };
}

export const MarketplaceWithdrawalForm = withForm({
  defaultValues: {
    destination_account_id: '',
    amount: '',
    transaction_date: '',
    reference: '',
    description: '',
  } as FinanceMarketplaceWithdrawalFormValues,
  props: {
    destinations: [],
    withdrawableBalance: 0,
    isSubmitting: false,
    errorMessage: null,
    successMessage: null,
  } as MarketplaceWithdrawalFormProps,
  render: function Render({
    form,
    destinations,
    withdrawableBalance,
    isSubmitting,
    errorMessage,
    successMessage,
  }) {
    return (
      <form
        className="grid min-w-0 gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <FieldGroup className="grid min-w-0 gap-5 sm:grid-cols-2">
          <form.AppField
            name="destination_account_id"
            children={(field) => (
              <field.SelectField
                label="Masuk ke akun"
                placeholder="Pilih Bank atau E-wallet"
                className="min-w-0"
                items={destinations.map((account) => ({
                  label: `${account.code} — ${account.name}`,
                  value: account.id,
                }))}
              />
            )}
          />
          <form.AppField
            name="amount"
            children={(field) => (
              <field.MoneyField
                label="Nominal penarikan"
                type="number"
                min={1}
                max={withdrawableBalance}
                step={1}
                inputMode="numeric"
                placeholder="500000"
                className="min-w-0"
              />
            )}
          />
          <form.AppField
            name="transaction_date"
            children={(field) => (
              <field.DateField
                label="Tanggal penarikan"
                valueType="string"
                placeholder="Pilih tanggal"
                required
                className="min-w-0"
                buttonClassName="w-full"
              />
            )}
          />
          <form.AppField
            name="reference"
            children={(field) => (
              <field.TextField
                label="Referensi (opsional)"
                maxLength={120}
                placeholder="Contoh: Penarikan Shopee 001"
                className="min-w-0"
              />
            )}
          />
          <form.AppField
            name="description"
            children={(field) => (
              <field.TextField
                label="Deskripsi (opsional)"
                maxLength={500}
                placeholder="Catatan penarikan marketplace"
                className="min-w-0 sm:col-span-2"
              />
            )}
          />
        </FieldGroup>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertDescription>
              {errorMessage}
            </AlertDescription>
          </Alert>
        ) : null}
        {successMessage ? (
          <Alert role="status">
            <AlertDescription>
              {successMessage}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              destinations.length === 0 ||
              withdrawableBalance < 1
            }
          >
            {isSubmitting
              ? 'Mem-posting…'
              : 'Catat penarikan'}
          </Button>
          <p className="text-muted-foreground text-xs">
            Jurnal debit ke Bank/E-wallet dan credit ke
            Saldo Marketplace.
          </p>
        </div>
      </form>
    );
  },
});
