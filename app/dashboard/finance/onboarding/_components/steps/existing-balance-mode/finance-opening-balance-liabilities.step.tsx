/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import { withForm } from '@/components/form/form.hook';
import { FieldGroup } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { createEmptyFinanceOpeningBalanceFormValues } from '../shared/finance-opening-balance.utils';
import {
  EmptyHint,
  OpeningSubledgerSection,
  SectionHeading,
} from '../shared/finance-opening-balance.shared';
import type { FinanceOpeningBalanceFormProps } from '../../finance-opening-balance.form';

type Props = Pick<
  FinanceOpeningBalanceFormProps,
  'setup'
> & {
  isBusy: boolean;
};

export const FinanceOpeningBalanceLiabilitiesStep =
  withForm({
    defaultValues:
      createEmptyFinanceOpeningBalanceFormValues(),
    props: {
      setup: {
        options: {
          liability_accounts: [],
          credit_payable_accounts: [],
          receivable_accounts: [],
          equity_accounts: [],
        },
      },
      isBusy: false,
    } as unknown as Props,
    render: function Render({ form, setup, isBusy }) {
      return (
        <div className="grid min-w-0 gap-8">
          <OpeningSubledgerSection
            form={form}
            fieldName="payable_lines"
            title="Utang supplier"
            description="Isi utang yang masih ada pada tanggal saldo awal. Gunakan satu baris per supplier, atau isi referensi jika hanya mengetahui totalnya."
            accounts={setup.options.liability_accounts}
            counterpartyLabel="Nama supplier / pihak"
            addLabel="Tambah utang"
            emptyLabel="Akun utang belum tersedia di Chart of Accounts."
            isDisabled={isBusy}
          />

          <OpeningSubledgerSection
            form={form}
            fieldName="payable_lines"
            title="Utang PayLater/Kartu Kredit (opsional)"
            description="Masukkan saldo yang masih terutang kepada penyedia PayLater atau kartu kredit pada tanggal saldo awal. Satu baris per penyedia."
            accounts={setup.options.credit_payable_accounts}
            counterpartyLabel="Nama bank / penyedia"
            addLabel="Tambah utang PayLater"
            emptyLabel="Akun PayLater/Kartu Kredit belum tersedia di Chart of Accounts."
            isDisabled={isBusy}
          />

          <Separator />

          <OpeningSubledgerSection
            form={form}
            fieldName="receivable_lines"
            title="Piutang (opsional)"
            description="Masukkan piutang yang ingin dilacak dan diselesaikan melalui Finance."
            accounts={setup.options.receivable_accounts}
            counterpartyLabel="Nama pelanggan / pihak"
            addLabel="Tambah piutang"
            emptyLabel="Akun piutang belum tersedia di Chart of Accounts."
            isDisabled={isBusy}
          />

          <Separator />

          <section className="grid min-w-0 gap-4">
            <SectionHeading
              title="Modal pemilik"
              description="Masukkan modal yang diketahui. Saldo laba akan dihitung otomatis sebagai penyeimbang saldo awal."
            />
            <FieldGroup className="grid min-w-0 gap-4 sm:grid-cols-2">
              <form.AppField
                name="owner_capital_account_id"
                children={(field) => (
                  <field.SelectField
                    label="Akun modal"
                    placeholder="Pilih akun modal"
                    className="min-w-0"
                    disabled={isBusy}
                    items={setup.options.equity_accounts.map(
                      (account) => ({
                        value: account.id,
                        label: `${account.code} — ${account.name}`,
                      })
                    )}
                  />
                )}
              />
              <form.AppField
                name="owner_capital_amount"
                children={(field) => (
                  <field.MoneyField
                    label="Modal yang ingin dicatat"
                    description="Masukkan 0 jika belum ingin mengisi modal pemilik."
                    inputMode="numeric"
                    min={0}
                    className="min-w-0"
                    disabled={isBusy}
                  />
                )}
              />
            </FieldGroup>
            {setup.options.equity_accounts.length === 0 ? (
              <EmptyHint>
                Akun modal belum tersedia di Chart of
                Accounts.
              </EmptyHint>
            ) : null}
          </section>
        </div>
      );
    },
  });
