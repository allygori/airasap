/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import { useStore } from '@tanstack/react-form';
import { formatIDR } from '@/lib/number/money';
import { withForm } from '@/components/form/form.hook';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { FieldGroup } from '@/components/ui/field';
import {
  FINANCE_CASH_BANK_SUBTYPE_LABELS,
  type FinanceCashBankAccountDTO,
} from '@/modules/finance/client';
import type { FinanceCashBankTransferFormValues } from './finance-cash-bank-transfer-form.schema';

type CashBankTransferFormProps = {
  accounts: FinanceCashBankAccountDTO[];
  isSubmitting: boolean;
  errorMessage: string | null;
  successMessage: string | null;
};

export function createCashBankTransferFormDefaults(
  accounts: FinanceCashBankAccountDTO[]
): FinanceCashBankTransferFormValues {
  return {
    source_account_id: accounts[0]?.id ?? '',
    destination_account_id:
      accounts[1]?.id ?? accounts[0]?.id ?? '',
    amount: '',
    transaction_date: new Date().toISOString().slice(0, 10),
    reference: '',
    description: '',
  };
}

export const CashBankTransferForm = withForm({
  defaultValues: {
    source_account_id: '',
    destination_account_id: '',
    amount: '',
    transaction_date: '',
    reference: '',
    description: '',
  } as FinanceCashBankTransferFormValues,
  props: {
    accounts: [],
    isSubmitting: false,
    errorMessage: null,
    successMessage: null,
  } as CashBankTransferFormProps,
  render: function Render({
    form,
    accounts,
    isSubmitting,
    errorMessage,
    successMessage,
  }) {
    const sourceAccountId = useStore(
      form.store,
      (state) => state.values.source_account_id
    );
    const destinationAccountId = useStore(
      form.store,
      (state) => state.values.destination_account_id
    );
    const sourceAccount = accounts.find(
      (account) => account.id === sourceAccountId
    );
    const destinationAccount = accounts.find(
      (account) => account.id === destinationAccountId
    );

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
            name="source_account_id"
            children={(field) => (
              <field.SelectField
                label="Dari akun"
                placeholder="Pilih akun sumber"
                className="min-w-0"
                items={accounts.map((account) => ({
                  label: `${account.code} — ${account.name}`,
                  value: account.id,
                }))}
              />
            )}
          />
          <form.AppField
            name="destination_account_id"
            children={(field) => (
              <field.SelectField
                label="Ke akun"
                placeholder="Pilih akun tujuan"
                className="min-w-0"
                items={accounts.map((account) => ({
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
                label="Jumlah transfer"
                type="number"
                min={1}
                max={1_000_000_000_000_000}
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
                label="Tanggal transaksi"
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
                placeholder="Contoh: Setoran kas 001"
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
                placeholder="Contoh: Pindah dana operasional"
                className="min-w-0"
              />
            )}
          />
        </FieldGroup>

        {sourceAccount && destinationAccount ? (
          <div className="bg-muted/30 grid min-w-0 gap-3 rounded-xl border p-4 sm:grid-cols-2">
            <BalanceHint
              label="Saldo sumber"
              account={sourceAccount}
            />
            <BalanceHint
              label="Saldo tujuan"
              account={destinationAccount}
            />
          </div>
        ) : null}

        {sourceAccountId === destinationAccountId ? (
          <Alert variant="destructive">
            <AlertDescription>
              Pilih akun sumber dan tujuan yang berbeda.
            </AlertDescription>
          </Alert>
        ) : null}
        {errorMessage ? (
          <Alert variant="destructive">
            {errorMessage}
          </Alert>
        ) : null}
        {successMessage ? (
          <Alert role="status">{successMessage}</Alert>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              !sourceAccountId ||
              !destinationAccountId ||
              sourceAccountId === destinationAccountId
            }
          >
            {isSubmitting
              ? 'Mem-posting…'
              : 'Post transfer'}
          </Button>
          <Badge variant="outline">
            Journal baru &amp; immutable
          </Badge>
        </div>
      </form>
    );
  },
});

function BalanceHint({
  label,
  account,
}: {
  label: string;
  account: FinanceCashBankAccountDTO;
}) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground text-xs uppercase">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm font-semibold break-words">
        {formatIDR(account.current_balance)}
      </p>
      <p className="text-muted-foreground mt-1 text-xs">
        {FINANCE_CASH_BANK_SUBTYPE_LABELS[account.subtype]}
      </p>
    </div>
  );
}
