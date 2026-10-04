/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import type { ComponentProps } from 'react';
import { withForm } from '@/components/form/form.hook';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import type { FinanceEWalletAccountCreateInputDTO } from '@/modules/finance/client';

export type FinanceEWalletAccountFormValues =
  FinanceEWalletAccountCreateInputDTO;

type FinanceEWalletAccountFormProps = {
  isSubmitting: boolean;
  onCancel: () => void;
};

export const FinanceEWalletAccountForm = withForm({
  defaultValues: {
    name: '',
    provider: '',
  } as FinanceEWalletAccountFormValues,
  props: {
    isSubmitting: false,
    onCancel: () => undefined,
  } as FinanceEWalletAccountFormProps,
  render: function Render({
    form,
    isSubmitting,
    onCancel,
  }) {
    return (
      <form
        className="grid min-w-0 gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <FieldGroup className="grid min-w-0 gap-4 sm:grid-cols-2">
          <form.AppField
            name="name"
            children={(field) => (
              <field.TextField
                label="Nama akun e-wallet"
                placeholder="Contoh: ShopeePay Toko"
                maxLength={120}
                required
                className="min-w-0"
              />
            )}
          />
          <form.AppField
            name="provider"
            children={(field) => (
              <field.TextField
                label="Penyedia e-wallet"
                placeholder="Contoh: ShopeePay, GoPay, DANA"
                maxLength={120}
                required
                className="min-w-0"
              />
            )}
          />
        </FieldGroup>

        <p className="text-muted-foreground text-xs leading-5">
          Jangan masukkan PIN, OTP, atau kredensial akun.
          Saldo e-wallet akan dibuat sebagai akun terpisah
          di Chart of Accounts Finance.
        </p>

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Menambahkan…'
              : 'Tambahkan e-wallet'}
          </Button>
        </div>
      </form>
    );
  },
});

export type FinanceEWalletAccountFormApi = ComponentProps<
  typeof FinanceEWalletAccountForm
>['form'];
