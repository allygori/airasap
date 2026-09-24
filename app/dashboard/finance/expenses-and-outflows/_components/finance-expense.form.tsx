/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import { useStore } from '@tanstack/react-form';
import { withForm } from '@/components/form/form.hook';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { FieldGroup } from '@/components/ui/field';
import { type FinanceExpenseFormValues } from './finance-expense-form.schema';

export type ExpenseAccountOption = {
  id: string;
  code: string;
  name: string;
  type: 'expense' | 'other_expense';
};

export type PaymentAccountOption = {
  id: string;
  code: string;
  name: string;
  subtype: string | null;
};

export type ExpenseFormIntent = 'draft' | 'post';

type ExpenseFormDefaultsInput = {
  categoryAccounts: ExpenseAccountOption[];
  paymentAccounts: PaymentAccountOption[];
};

export function createExpenseFormDefaults({
  categoryAccounts,
  paymentAccounts,
}: ExpenseFormDefaultsInput): FinanceExpenseFormValues {
  return {
    category_account_id: categoryAccounts[0]?.id ?? '',
    amount: '',
    expense_date: new Date().toISOString().slice(0, 10),
    description: '',
    vendor_name: '',
    reference: '',
    payment_timing: 'paid',
    payment_account_id: paymentAccounts[0]?.id ?? '',
    notes: '',
    attachment_reference: '',
  };
}

type ExpenseFormProps = {
  categoryAccounts: ExpenseAccountOption[];
  paymentAccounts: PaymentAccountOption[];
  isSubmitting: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onSubmitIntent: (intent: ExpenseFormIntent) => void;
};

export const ExpenseForm = withForm({
  defaultValues: {
    category_account_id: '',
    amount: '',
    expense_date: '',
    description: '',
    vendor_name: '',
    reference: '',
    payment_timing: 'paid',
    payment_account_id: '',
    notes: '',
    attachment_reference: '',
  } as FinanceExpenseFormValues,
  props: {
    categoryAccounts: [],
    paymentAccounts: [],
    isSubmitting: false,
    errorMessage: null,
    successMessage: null,
    onSubmitIntent: () => undefined,
  } as ExpenseFormProps,
  render: function Render({
    form,
    categoryAccounts,
    paymentAccounts,
    isSubmitting,
    errorMessage,
    successMessage,
    onSubmitIntent,
  }) {
    const paymentTiming = useStore(
      form.store,
      (state) => state.values.payment_timing
    );
    const hasPaymentAccounts = paymentAccounts.length > 0;

    return (
      <form
        className="grid min-w-0 gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onSubmitIntent('post');
        }}
      >
        <FieldGroup className="grid min-w-0 gap-5 sm:grid-cols-2">
          <form.AppField
            name="category_account_id"
            children={(field) => (
              <field.SelectField
                label="Kategori expense"
                placeholder="Pilih kategori expense"
                className="min-w-0"
                items={categoryAccounts.map((account) => ({
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
                label="Nominal"
                type="number"
                min={1}
                max={1_000_000_000_000_000}
                step={1}
                inputMode="numeric"
                placeholder="150000"
                className="min-w-0"
              />
            )}
          />
          <form.AppField
            name="expense_date"
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
            name="payment_timing"
            children={(field) => (
              <field.SelectField
                label="Cara pembayaran"
                placeholder="Pilih cara pembayaran"
                className="min-w-0"
                items={[
                  { label: 'Sudah dibayar', value: 'paid' },
                  {
                    label: 'Jadi Utang Usaha',
                    value: 'payable',
                  },
                ]}
              />
            )}
          />
        </FieldGroup>

        {paymentTiming === 'paid' ? (
          <form.AppField
            name="payment_account_id"
            children={(field) => (
              <field.SelectField
                label="Dibayar dari"
                placeholder="Pilih akun Kas/Bank"
                className="min-w-0"
                disabled={!hasPaymentAccounts}
                items={paymentAccounts.map((account) => ({
                  label: `${account.code} — ${account.name}`,
                  value: account.id,
                }))}
                description={
                  hasPaymentAccounts
                    ? undefined
                    : 'Belum ada akun Kas, Bank, E-wallet, atau Saldo Marketplace yang aktif dan postable.'
                }
              />
            )}
          />
        ) : (
          <Alert>
            <AlertDescription>
              Expense akan dicatat ke Utang Usaha 2100.
              Pembayaran utang dilakukan melalui transaksi
              settlement.
            </AlertDescription>
          </Alert>
        )}

        <FieldGroup className="grid min-w-0 gap-5 sm:grid-cols-2">
          <form.AppField
            name="description"
            children={(field) => (
              <field.TextField
                label="Deskripsi"
                maxLength={500}
                placeholder="Contoh: Internet toko bulan September"
                className="min-w-0"
              />
            )}
          />
          <form.AppField
            name="vendor_name"
            children={(field) => (
              <field.TextField
                label="Vendor / penerima (opsional)"
                maxLength={160}
                placeholder="Contoh: Penyedia internet"
                className="min-w-0"
              />
            )}
          />
          <form.AppField
            name="reference"
            children={(field) => (
              <field.TextField
                label="No. invoice / referensi"
                maxLength={120}
                placeholder="Contoh: INV-2026-009"
                className="min-w-0"
              />
            )}
          />
          <form.AppField
            name="attachment_reference"
            children={(field) => (
              <field.TextField
                label="Referensi lampiran (opsional)"
                maxLength={200}
                placeholder="Contoh: drive://invoice-009"
                className="min-w-0"
              />
            )}
          />
          <form.AppField
            name="notes"
            children={(field) => (
              <field.TextareaField
                label="Catatan (opsional)"
                maxLength={500}
                rows={3}
                placeholder="Catatan tambahan untuk transaksi ini"
                className="min-w-0 sm:col-span-2"
              />
            )}
          />
        </FieldGroup>

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
            type="button"
            variant="outline"
            disabled={
              isSubmitting ||
              (paymentTiming === 'paid' &&
                !hasPaymentAccounts)
            }
            onClick={() => onSubmitIntent('draft')}
          >
            Simpan draft
          </Button>
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              (paymentTiming === 'paid' &&
                !hasPaymentAccounts)
            }
          >
            {isSubmitting ? 'Memproses…' : 'Simpan & post'}
          </Button>
          <Badge variant="outline">
            Journal selalu seimbang
          </Badge>
        </div>
      </form>
    );
  },
});
