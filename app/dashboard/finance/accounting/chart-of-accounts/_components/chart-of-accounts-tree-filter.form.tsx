/* eslint-disable react/no-children-prop -- TanStack AppField uses the project's render-prop children API. */
'use client';

import { withForm } from '@/components/form/form.hook';
import { FieldGroup } from '@/components/ui/field';

type TreeFilterValues = {
  query: string;
  typeFilter: string;
};

type TreeFilterOption = {
  label: string;
  value: string;
};

const TreeFilterFields = withForm({
  defaultValues: {
    query: '',
    typeFilter: 'all',
  } as TreeFilterValues,
  props: {
    accountTypes: [] as TreeFilterOption[],
  },
  render: function Render({ form, accountTypes }) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row"
      >
        <FieldGroup className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_13rem]">
          <form.AppField
            name="query"
            children={(field) => (
              <field.TextField
                label="Cari akun"
                placeholder="Kode, nama, atau subtype akun"
                className="min-w-0"
              />
            )}
          />
          <form.AppField
            name="typeFilter"
            children={(field) => (
              <field.SelectField
                label="Tipe akun"
                placeholder="Pilih tipe akun"
                items={accountTypes}
                className="min-w-0"
              />
            )}
          />
        </FieldGroup>
      </form>
    );
  },
});

export function ChartOfAccountsTreeFilter({
  form,
  accountTypes,
}: {
  form: Parameters<typeof TreeFilterFields>[0]['form'];
  accountTypes: TreeFilterOption[];
}) {
  return (
    <TreeFilterFields
      form={form}
      accountTypes={accountTypes}
    />
  );
}
