/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  withForm,
  useAppForm,
} from '@/components/form/form.hook';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { buildFinanceFilterHref } from '@/app/dashboard/finance/_lib/finance-filter-url';
import type { FinanceOwnerAccountOption } from './owner-withdrawal.form';
import {
  OwnerWithdrawalFilterFormSchema,
  type OwnerWithdrawalFilterFormValues,
} from './owner-withdrawal-filter.form.schema';

const OwnerWithdrawalFilterFields = withForm({
  defaultValues: {
    from_date: '',
    to_date: '',
    owner_account_id: '',
  } as OwnerWithdrawalFilterFormValues,
  props: {
    ownerAccounts: [] as FinanceOwnerAccountOption[],
  },
  render: function Render({ form, ownerAccounts }) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
        className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1fr)_minmax(15rem,1.2fr)_auto] lg:items-end"
      >
        <FieldGroup className="contents">
          <form.AppField
            name="from_date"
            children={(field) => (
              <field.DateField
                label="Dari tanggal"
                valueType="string"
                required
                clearable={false}
                className="min-w-0"
                buttonClassName="w-full"
              />
            )}
          />
          <form.AppField
            name="to_date"
            children={(field) => (
              <field.DateField
                label="Sampai tanggal"
                valueType="string"
                required
                clearable={false}
                className="min-w-0"
                buttonClassName="w-full"
              />
            )}
          />
          <form.AppField
            name="owner_account_id"
            children={(field) => (
              <field.SelectField
                label="Akun prive"
                placeholder="Semua akun prive"
                className="min-w-0"
                items={[
                  { label: 'Semua akun prive', value: '' },
                  ...ownerAccounts.map((account) => ({
                    label: `${account.code} — ${account.name}`,
                    value: account.id,
                  })),
                ]}
              />
            )}
          />
          <Button type="submit" variant="secondary">
            Terapkan filter
          </Button>
        </FieldGroup>
      </form>
    );
  },
});

export function OwnerWithdrawalFilterForm({
  initialValues,
  ownerAccounts,
}: {
  initialValues: OwnerWithdrawalFilterFormValues;
  ownerAccounts: FinanceOwnerAccountOption[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const form = useAppForm({
    defaultValues: initialValues,
    validators: {
      onSubmit: ({ value }) => {
        const result =
          OwnerWithdrawalFilterFormSchema.safeParse(value);
        return result.success ? undefined : result.error;
      },
    },
    onSubmit: async ({ value }) => {
      router.push(
        buildFinanceFilterHref(pathname, {
          from_date: value.from_date,
          to_date: value.to_date,
          owner_account_id: value.owner_account_id,
        })
      );
    },
  });

  return (
    <OwnerWithdrawalFilterFields
      form={form}
      ownerAccounts={ownerAccounts}
    />
  );
}
