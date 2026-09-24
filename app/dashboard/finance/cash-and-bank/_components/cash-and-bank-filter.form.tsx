/* eslint-disable react/no-children-prop -- TanStack AppField uses the project's render-prop children API. */
'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  useAppForm,
  withForm,
} from '@/components/form/form.hook';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { buildFinanceFilterHref } from '@/app/dashboard/finance/_lib/finance-filter-url';

type CashAndBankFilterValues = { search: string };

const CashAndBankFilterFields = withForm({
  defaultValues: { search: '' } as CashAndBankFilterValues,
  render: function Render({ form }) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
        className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end"
      >
        <FieldGroup className="min-w-0 flex-1">
          <form.AppField
            name="search"
            children={(field) => (
              <field.TextField
                label="Cari akun"
                type="search"
                placeholder="Nama atau kode akun"
                maxLength={80}
                className="min-w-0 sm:min-w-64"
              />
            )}
          />
        </FieldGroup>
        <Button type="submit" variant="secondary">
          Cari
        </Button>
      </form>
    );
  },
});

export function CashAndBankFilterForm({
  initialValues,
}: {
  initialValues: CashAndBankFilterValues;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const form = useAppForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      router.push(buildFinanceFilterHref(pathname, value));
    },
  });

  return <CashAndBankFilterFields form={form} />;
}
