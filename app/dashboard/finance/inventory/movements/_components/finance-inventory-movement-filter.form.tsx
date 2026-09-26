/* eslint-disable react/no-children-prop -- TanStack AppField uses the project's render-prop children API. */
'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  useAppForm,
  withForm,
} from '@/components/form/form.hook';
import { buildFinanceFilterHref } from '@/app/dashboard/finance/_lib/finance-filter-url';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';

type MovementFilterValues = {
  search: string;
  movement_type: string;
  status: string;
};

const movementTypeItems = [
  { label: 'Semua jenis', value: 'all' },
  { label: 'Saldo awal', value: 'opening_balance' },
  { label: 'Pembelian', value: 'purchase' },
  { label: 'Penjualan', value: 'sale' },
  { label: 'Retur', value: 'return' },
  { label: 'Penyesuaian', value: 'adjustment' },
  { label: 'Barang rusak', value: 'damage' },
  { label: 'Kehilangan', value: 'loss' },
  { label: 'Transfer masuk', value: 'transfer_in' },
  { label: 'Transfer keluar', value: 'transfer_out' },
  { label: 'Pemakaian', value: 'consumption' },
] as const;

const statusItems = [
  { label: 'Semua status', value: 'all' },
  { label: 'Posted', value: 'posted' },
  { label: 'Draft', value: 'draft' },
  { label: 'Void', value: 'voided' },
] as const;

const MovementFilterFields = withForm({
  defaultValues: {
    search: '',
    movement_type: 'all',
    status: 'posted',
  } as MovementFilterValues,
  render: function Render({ form }) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
        className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(13rem,1fr)_12rem_9rem_auto] xl:items-end"
      >
        <FieldGroup className="contents">
          <form.AppField
            name="search"
            children={(field) => (
              <field.TextField
                label="Cari referensi atau catatan"
                type="search"
                placeholder="Referensi, sumber, atau catatan"
                maxLength={100}
                className="min-w-0"
              />
            )}
          />
          <form.AppField
            name="movement_type"
            children={(field) => (
              <field.SelectField
                label="Jenis mutasi"
                items={[...movementTypeItems]}
                placeholder="Pilih jenis"
              />
            )}
          />
          <form.AppField
            name="status"
            children={(field) => (
              <field.SelectField
                label="Status"
                items={[...statusItems]}
                placeholder="Pilih status"
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

export function FinanceInventoryMovementFilterForm({
  initialValues,
}: {
  initialValues: MovementFilterValues;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const form = useAppForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      router.push(buildFinanceFilterHref(pathname, value));
    },
  });

  return <MovementFilterFields form={form} />;
}
