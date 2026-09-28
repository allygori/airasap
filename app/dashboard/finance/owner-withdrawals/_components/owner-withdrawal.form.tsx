/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import { withForm } from '@/components/form/form.hook';
import { Button } from '@/components/ui/button';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import type { FinanceOwnerWithdrawalFormValues } from './owner-withdrawal.form.schema';

export type FinanceOwnerAccountOption = {
  id: string;
  code: string;
  name: string;
};

export type FinanceWithdrawalPaymentAccountOption = {
  id: string;
  code: string;
  name: string;
};

export type OwnerWithdrawalFormIntent = 'draft' | 'post';

export type OwnerWithdrawalFormDefaults = {
  businessDate: string;
};

export function createOwnerWithdrawalFormDefaults({
  businessDate,
}: OwnerWithdrawalFormDefaults): FinanceOwnerWithdrawalFormValues {
  return {
    owner_account_id: '',
    payment_account_id: '',
    amount: '',
    transaction_date: businessDate,
    description: '',
    reference: '',
  };
}

type OwnerWithdrawalFormProps = {
  ownerAccounts: FinanceOwnerAccountOption[];
  paymentAccounts: FinanceWithdrawalPaymentAccountOption[];
  isSubmitting: boolean;
  onSubmitIntent: (
    intent: OwnerWithdrawalFormIntent
  ) => void;
};

export const OwnerWithdrawalForm = withForm({
  defaultValues: {
    owner_account_id: '',
    payment_account_id: '',
    amount: '',
    transaction_date: '',
    description: '',
    reference: '',
  } as FinanceOwnerWithdrawalFormValues,
  props: {
    ownerAccounts: [],
    paymentAccounts: [],
    isSubmitting: false,
    onSubmitIntent: () => undefined,
  } as OwnerWithdrawalFormProps,
  render: function Render({
    form,
    ownerAccounts,
    paymentAccounts,
    isSubmitting,
    onSubmitIntent,
  }) {
    const hasAccounts =
      ownerAccounts.length > 0 &&
      paymentAccounts.length > 0;

    return (
      <form
        className="grid min-w-0 gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onSubmitIntent('post');
        }}
      >
        <Alert>
          <AlertTitle>Catat penarikan pemilik</AlertTitle>
          <AlertDescription>
            Gunakan hanya untuk uang yang benar-benar
            diambil pemilik dari usaha dan sudah keluar dari
            Kas/Bank. Transaksi ini mengurangi ekuitas,
            bukan laba usaha. Jangan gunakan untuk gaji,
            dividen formal, atau pinjaman pemilik; Finance
            juga tidak menilai apakah jumlahnya boleh
            dibagikan secara hukum.
          </AlertDescription>
        </Alert>

        <FieldGroup className="grid min-w-0 gap-5 sm:grid-cols-2">
          <form.AppField
            name="owner_account_id"
            children={(field) => (
              <field.SelectField
                label="Pemilik"
                placeholder="Pilih akun pemilik"
                className="min-w-0"
                disabled={!ownerAccounts.length}
                items={ownerAccounts.map((account) => ({
                  label: `${account.code} — ${account.name}`,
                  value: account.id,
                }))}
                description={
                  ownerAccounts.length
                    ? 'Akun prive menentukan pemilik yang mengambil dana.'
                    : 'Belum ada akun prive yang aktif. Periksa Chart of Accounts.'
                }
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
            name="payment_account_id"
            children={(field) => (
              <field.SelectField
                label="Diambil dari"
                placeholder="Pilih akun Kas/Bank"
                className="min-w-0"
                disabled={!paymentAccounts.length}
                items={paymentAccounts.map((account) => ({
                  label: `${account.code} — ${account.name}`,
                  value: account.id,
                }))}
                description={
                  paymentAccounts.length
                    ? 'Pilih akun tempat uang benar-benar keluar.'
                    : 'Belum ada akun Kas atau Bank yang aktif dan dapat diposting.'
                }
              />
            )}
          />
          <form.AppField
            name="description"
            children={(field) => (
              <field.TextField
                label="Deskripsi (opsional)"
                maxLength={500}
                placeholder="Contoh: Penarikan laba bulan September"
                className="min-w-0"
              />
            )}
          />
          <form.AppField
            name="reference"
            children={(field) => (
              <field.TextField
                label="Referensi (opsional)"
                maxLength={120}
                placeholder="Contoh: TRANSFER-2026-09"
                className="min-w-0"
              />
            )}
          />
        </FieldGroup>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting || !hasAccounts}
            onClick={() => onSubmitIntent('draft')}
          >
            Simpan draft
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !hasAccounts}
          >
            {isSubmitting ? (
              <>
                <Spinner data-icon="inline-start" />
                Menyimpan…
              </>
            ) : (
              'Simpan & post'
            )}
          </Button>
        </div>
      </form>
    );
  },
});
