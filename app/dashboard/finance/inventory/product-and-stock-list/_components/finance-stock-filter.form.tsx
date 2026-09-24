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

type StockFilterValues = {
  search: string;
  item_type: string;
};

const itemTypeItems = [
  { label: 'Semua tipe', value: 'all' },
  { label: 'Merchandise', value: 'merchandise' },
  { label: 'Packaging', value: 'packaging' },
  { label: 'Supplies', value: 'supplies' },
  { label: 'Fixed asset', value: 'fixed_asset' },
] as const;

const StockFilterFields = withForm({
  defaultValues: {
    search: '',
    item_type: 'all',
  } as StockFilterValues,
  render: function Render({ form }) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
        className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(13rem,1fr)_auto_auto] xl:items-end"
      >
        <FieldGroup className="contents">
          <form.AppField
            name="search"
            children={(field) => (
              <field.TextField
                label="Cari item"
                type="search"
                placeholder="SKU atau nama item"
                maxLength={100}
                className="min-w-0"
              />
            )}
          />
          <form.AppField
            name="item_type"
            children={(field) => (
              <field.ToggleGroupField
                label="Tipe"
                items={itemTypeItems}
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

export function FinanceStockFilterForm({
  initialValues,
}: {
  initialValues: StockFilterValues;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const form = useAppForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      router.push(buildFinanceFilterHref(pathname, value));
    },
  });

  return <StockFilterFields form={form} />;
}
