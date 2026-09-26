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

type JournalFilterValues = {
  search: string;
  period: string;
  period_to: string;
  account_id: string;
  status: string;
};

const statusItems = [
  { label: 'Semua', value: 'all' },
  { label: 'Posted', value: 'posted' },
  { label: 'Reversed', value: 'reversed' },
] as const;

const JournalFilterFields = withForm({
  defaultValues: {
    search: '',
    period: '',
    period_to: '',
    account_id: '',
    status: 'all',
  } as JournalFilterValues,
  render: function Render({ form }) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
        className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(13rem,1fr)_10rem_auto_auto] xl:items-end"
      >
        <FieldGroup className="contents">
          <form.AppField
            name="search"
            children={(field) => (
              <field.TextField
                label="Cari"
                type="search"
                placeholder="Nomor, deskripsi, source ID"
                maxLength={80}
                className="min-w-0"
              />
            )}
          />
          <form.AppField
            name="period"
            children={(field) => (
              <field.TextField
                label="Periode"
                type="month"
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
          <Button type="submit" variant="secondary">
            Terapkan
          </Button>
        </FieldGroup>
      </form>
    );
  },
});

export function GeneralJournalFilterForm({
  initialValues,
}: {
  initialValues: JournalFilterValues;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const form = useAppForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      router.push(buildFinanceFilterHref(pathname, value));
    },
  });

  return <JournalFilterFields form={form} />;
}
