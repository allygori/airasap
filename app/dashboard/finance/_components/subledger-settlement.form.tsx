/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import { useStore } from '@tanstack/react-form';
import { withForm } from '@/components/form/form.hook';
import { Button } from '@/components/ui/button';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { FieldGroup } from '@/components/ui/field';
import { formatIDR as formatMoney } from '@/lib/number/money';
import type { FinanceSubledgerBalanceDTO } from '@/modules/finance/client';
import type { FinanceSubledgerPaymentAccountOption } from '../_lib/load-subledger-page-data';
import type { FinanceSubledgerSettlementFormValues } from './finance-subledger-settlement-form.schema';

type SubledgerSettlementFormProps = {
  balances: FinanceSubledgerBalanceDTO[];
  paymentAccounts: FinanceSubledgerPaymentAccountOption[];
  isReceivable: boolean;
  actionLabel: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  successMessage: string | null;
};

export function createSubledgerSettlementFormDefaults(
  balances: FinanceSubledgerBalanceDTO[],
  paymentAccounts: FinanceSubledgerPaymentAccountOption[]
): FinanceSubledgerSettlementFormValues {
  return {
    source_key: balances[0]?.source_key ?? '',
    amount: '',
    settlement_date: new Date().toISOString().slice(0, 10),
    payment_account_id: paymentAccounts[0]?.id ?? '',
    reference: '',
  };
}

export const SubledgerSettlementForm = withForm({
  defaultValues: {
    source_key: '',
    amount: '',
    settlement_date: '',
    payment_account_id: '',
    reference: '',
  } as FinanceSubledgerSettlementFormValues,
  props: {
    balances: [],
    paymentAccounts: [],
    isReceivable: false,
    actionLabel: '',
    isSubmitting: false,
    errorMessage: null,
    successMessage: null,
  } as SubledgerSettlementFormProps,
  render: function Render({
    form,
    balances,
    paymentAccounts,
    isReceivable,
    actionLabel,
    isSubmitting,
    errorMessage,
    successMessage,
  }) {
    const sourceKey = useStore(
      form.store,
      (state) => state.values.source_key
    );
    const selectedBalance = balances.find(
      (balance) => balance.source_key === sourceKey
    );

    return (
      <form
        className="grid min-w-0 gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <FieldGroup className="min-w-0">
          <form.AppField
            name="source_key"
            children={(field) => (
              <field.SelectField
                label="Sumber saldo"
                placeholder="Pilih saldo"
                className="min-w-0"
                items={balances.map((balance) => ({
                  label: `${balance.source_label} — ${formatMoney(balance.outstanding_amount)}`,
                  value: balance.source_key,
                }))}
              />
            )}
          />
          <form.AppField
            name="amount"
            children={(field) => (
              <field.MoneyField
                label="Nominal"
                type="number"
                min={1}
                max={selectedBalance?.outstanding_amount}
                step={1}
                inputMode="numeric"
                placeholder={
                  selectedBalance
                    ? String(
                        selectedBalance.outstanding_amount
                      )
                    : '100000'
                }
                description={
                  selectedBalance
                    ? `Maksimal ${formatMoney(selectedBalance.outstanding_amount)}.`
                    : undefined
                }
                className="min-w-0"
              />
            )}
          />
          <form.AppField
            name="payment_account_id"
            children={(field) => (
              <field.SelectField
                label={
                  isReceivable
                    ? 'Diterima ke'
                    : 'Dibayar dari'
                }
                placeholder="Pilih akun Kas/Bank"
                className="min-w-0"
                disabled={paymentAccounts.length === 0}
                items={paymentAccounts.map((account) => ({
                  label: `${account.code} — ${account.name}`,
                  value: account.id,
                }))}
              />
            )}
          />
          <form.AppField
            name="settlement_date"
            children={(field) => (
              <field.DateField
                label="Tanggal settlement"
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
                placeholder="Contoh: PAYOUT-001"
                className="min-w-0"
              />
            )}
          />
        </FieldGroup>

        <Alert>
          <AlertDescription>
            Jatuh tempo belum diatur pada source
            transaction. Finance tidak menandai transaksi
            sebagai overdue secara otomatis.
          </AlertDescription>
        </Alert>
        {errorMessage ? (
          <Alert variant="destructive">
            {errorMessage}
          </Alert>
        ) : null}
        {successMessage ? (
          <Alert role="status">{successMessage}</Alert>
        ) : null}
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            paymentAccounts.length === 0 ||
            balances.length === 0
          }
        >
          {isSubmitting ? 'Mem-posting…' : actionLabel}
        </Button>
      </form>
    );
  },
});
