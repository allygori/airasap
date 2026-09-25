/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import type { ComponentProps } from 'react';
import { withForm } from '@/components/form/form.hook';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { type FinanceBankAccountCreateInputDTO } from '@/modules/finance/client';

export type FinanceBankAccountFormValues =
  FinanceBankAccountCreateInputDTO;

type FinanceBankAccountFormProps = {
  isSubmitting: boolean;
  onCancel: () => void;
};

export const FinanceBankAccountForm = withForm({
  defaultValues: {
    name: '',
    institution: '',
    account_last4: '',
    account_holder: '',
  } as FinanceBankAccountFormValues,
  props: {
    isSubmitting: false,
    onCancel: () => undefined,
  } as FinanceBankAccountFormProps,
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
                label="Nama rekening"
                placeholder="Contoh: BCA Operasional"
                maxLength={120}
                required
                className="min-w-0"
              />
            )}
          />
          <form.AppField
            name="institution"
            children={(field) => (
              <field.TextField
                label="Nama bank (opsional)"
                placeholder="Contoh: BCA"
                maxLength={120}
                className="min-w-0"
              />
            )}
          />
          <form.AppField
            name="account_holder"
            children={(field) => (
              <field.TextField
                label="Pemilik rekening (opsional)"
                placeholder="Nama pemilik rekening"
                maxLength={120}
                className="min-w-0"
              />
            )}
          />
          <form.AppField
            name="account_last4"
            children={(field) => (
              <field.TextField
                label="4 digit terakhir (opsional)"
                placeholder="1234"
                inputMode="numeric"
                maxLength={4}
                className="min-w-0"
              />
            )}
          />
        </FieldGroup>

        <p className="text-muted-foreground text-xs leading-5">
          Nomor rekening lengkap tidak diperlukan. Rekening
          akan dibuat sebagai akun Bank di Chart of Accounts
          Finance.
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
              : 'Tambahkan rekening'}
          </Button>
        </div>
      </form>
    );
  },
});

export type FinanceBankAccountFormApi = ComponentProps<
  typeof FinanceBankAccountForm
>['form'];
