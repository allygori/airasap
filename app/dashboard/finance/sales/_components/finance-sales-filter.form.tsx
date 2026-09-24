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

type SalesFilterValues = {
  search: string;
  status: string;
  posting_mode: string;
};

const statusItems = [
  { label: 'Semua', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Posted', value: 'posted' },
  { label: 'Reversed', value: 'reversed' },
] as const;

const postingModeItems = [
  { label: 'Semua mode', value: 'all' },
  { label: 'Manual', value: 'manual' },
  { label: 'Automatic', value: 'automatic' },
] as const;

const SalesFilterFields = withForm({
  defaultValues: {
    search: '',
    status: 'all',
    posting_mode: 'all',
  } as SalesFilterValues,
  render: function Render({ form }) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
        className="grid min-w-0 gap-3 lg:grid-cols-2 xl:grid-cols-[minmax(13rem,1fr)_auto_auto_auto] xl:items-end"
      >
        <FieldGroup className="contents">
          <form.AppField
            name="search"
            children={(field) => (
              <field.TextField
                label="Cari transaksi"
                type="search"
                placeholder="Nomor, source ID, alasan"
                maxLength={100}
                className="min-w-0"
              />
            )}
          />
          <form.AppField
            name="status"
            children={(field) => (
              <field.ToggleGroupField
                label="Status"
                items={statusItems}
                size="sm"
                variant="outline"
                spacing={0}
                groupClassName="max-w-full"
              />
            )}
          />
          <form.AppField
            name="posting_mode"
            children={(field) => (
              <field.ToggleGroupField
                label="Mode posting"
                items={postingModeItems}
                size="sm"
                variant="outline"
                spacing={0}
                groupClassName="max-w-full"
              />
            )}
          />
          <Button type="submit" variant="secondary">
            Terapkan
          </Button>
        </FieldGroup>
      </form>
    );
  },
});

export function FinanceSalesFilterForm({
  initialValues,
}: {
  initialValues: SalesFilterValues;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const form = useAppForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      router.push(buildFinanceFilterHref(pathname, value));
    },
  });

  return <SalesFilterFields form={form} />;
}
