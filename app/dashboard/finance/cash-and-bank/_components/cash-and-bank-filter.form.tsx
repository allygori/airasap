/* eslint-disable react/no-children-prop -- TanStack AppField uses the project's render-prop children API. */
'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  useAppForm,
  withForm,
} from '@/components/form/form.hook';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { buildFinanceFilterHref } from '@/app/dashboard/finance/_lib/finance-filter-url';

type CashAndBankFilterValues = {
  search: string;
  status: 'all' | 'active' | 'inactive';
};

const CashAndBankFilterFields = withForm({
  defaultValues: {
    search: '',
    status: 'all',
  } as CashAndBankFilterValues,
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
        <FieldGroup className="min-w-0 flex-1 sm:w-64 sm:flex-none">
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
        <form.AppField name="status">
          {(field) => (
            <Select
              value={field.state.value}
              onValueChange={(value) => {
                if (
                  value === 'all' ||
                  value === 'active' ||
                  value === 'inactive'
                ) {
                  field.handleChange(value);
                }
              }}
            >
              <SelectTrigger
                aria-label="Filter status akun"
                className="h-10 w-full sm:w-36"
              >
                <SelectValue>
                  {field.state.value === 'active'
                    ? 'Aktif'
                    : field.state.value === 'inactive'
                      ? 'Nonaktif'
                      : 'Semua status'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="all">
                  Semua status
                </SelectItem>
                <SelectItem value="active">
                  Aktif
                </SelectItem>
                <SelectItem value="inactive">
                  Nonaktif
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </form.AppField>
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
      router.push(
        buildFinanceFilterHref(pathname, {
          search: value.search,
          status: value.status,
        })
      );
    },
  });

  return <CashAndBankFilterFields form={form} />;
}
