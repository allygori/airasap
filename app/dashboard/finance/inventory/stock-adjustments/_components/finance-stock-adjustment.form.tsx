/* eslint-disable react/no-children-prop -- TanStack AppField uses the project's render-prop children API. */
'use client';

import { useStore } from '@tanstack/react-form';
import { withForm } from '@/components/form/form.hook';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import type {
  FinanceInventoryAdjustmentItemOptionDTO,
  FinanceInventoryAdjustmentLocationOptionDTO,
} from '@/modules/finance/client';
import type { FinanceStockAdjustmentFormValues } from './finance-stock-adjustment.schema';

const directionItems = [
  { label: 'Tambah stok', value: 'increase' },
  { label: 'Kurangi stok', value: 'decrease' },
] as const;

const reasonItems = [
  { label: 'Stock count', value: 'stock_count' },
  { label: 'Kerusakan', value: 'damage' },
  { label: 'Kehilangan', value: 'loss' },
  { label: 'Lainnya', value: 'other' },
] as const;

type FinanceStockAdjustmentFormProps = {
  items: FinanceInventoryAdjustmentItemOptionDTO[];
  locations: FinanceInventoryAdjustmentLocationOptionDTO[];
  isSubmitting: boolean;
  errorMessage: string | null;
  successMessage: string | null;
};

export const FinanceStockAdjustmentForm = withForm({
  defaultValues: {
    item_id: '',
    location_id: '',
    direction: 'increase',
    reason: 'stock_count',
    quantity: '1',
    unit_cost: '',
    transaction_date: '',
    notes: '',
  } as FinanceStockAdjustmentFormValues,
  props: {
    items: [],
    locations: [],
    isSubmitting: false,
    errorMessage: null,
    successMessage: null,
  } as FinanceStockAdjustmentFormProps,
  render: function Render({
    form,
    items,
    locations,
    isSubmitting,
    errorMessage,
    successMessage,
  }) {
    const selectedItemId = useStore(
      form.store,
      (state) => state.values.item_id
    );
    const selectedItem = items.find(
      (item) => item.id === selectedItemId
    );

    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
        className="grid min-w-0 gap-5"
      >
        <FieldGroup className="grid min-w-0 gap-5 sm:grid-cols-2">
          <form.AppField
            name="item_id"
            children={(field) => (
              <field.SelectField
                label="Item inventory"
                placeholder="Pilih item inventory"
                items={items.map((item) => ({
                  label: `${item.sku} — ${item.name}`,
                  value: item.id,
                }))}
                disabled={isSubmitting}
                className="min-w-0"
              />
            )}
          />
          <form.AppField
            name="location_id"
            children={(field) => (
              <field.SelectField
                label="Lokasi"
                placeholder="Pilih lokasi"
                items={locations.map((location) => ({
                  label: `${location.code} — ${location.name}`,
                  value: location.id,
                }))}
                disabled={isSubmitting}
                className="min-w-0"
              />
            )}
          />
          <form.AppField
            name="direction"
            children={(field) => (
              <field.ToggleGroupField
                label="Aksi stok"
                items={directionItems}
                variant="outline"
                size="sm"
                spacing={0}
                disabled={isSubmitting}
              />
            )}
          />
          <form.AppField
            name="reason"
            children={(field) => (
              <field.ToggleGroupField
                label="Alasan"
                items={reasonItems}
                variant="outline"
                size="sm"
                spacing={0}
                disabled={isSubmitting}
                groupClassName="flex-wrap"
              />
            )}
          />
          <form.AppField
            name="quantity"
            children={(field) => (
              <field.TextField
                label={`Quantity (${selectedItem?.unit ?? 'unit'})`}
                type="number"
                min={1}
                max={1_000_000}
                step={1}
                disabled={isSubmitting}
                className="min-w-0"
              />
            )}
          />
          {selectedItem?.track_value ? (
            <form.AppField
              name="unit_cost"
              children={(field) => (
                <field.TextField
                  label="Unit cost (IDR)"
                  type="number"
                  min={1}
                  max={1_000_000_000_000}
                  step={1}
                  placeholder="Contoh: 25000"
                  disabled={isSubmitting}
                  className="min-w-0"
                />
              )}
            />
          ) : (
            <div className="border-info/30 bg-info/5 self-end rounded-lg border p-3 text-sm leading-6">
              Item ini hanya melacak quantity. Adjustment
              tidak membuat journal nilai.
            </div>
          )}
          <form.AppField
            name="transaction_date"
            children={(field) => (
              <field.TextField
                label="Tanggal transaksi"
                type="date"
                disabled={isSubmitting}
                className="min-w-0"
              />
            )}
          />
          <form.AppField
            name="notes"
            children={(field) => (
              <field.TextField
                label="Catatan (opsional)"
                maxLength={500}
                placeholder="Contoh: Hasil opname 22 September"
                disabled={isSubmitting}
                className="min-w-0"
              />
            )}
          />
        </FieldGroup>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>
              Adjustment belum diposting
            </AlertTitle>
            <AlertDescription>
              {errorMessage}
            </AlertDescription>
          </Alert>
        ) : null}
        {successMessage ? (
          <Alert>
            <AlertTitle>
              Adjustment berhasil diposting
            </AlertTitle>
            <AlertDescription>
              {successMessage}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Mem-posting…'
              : 'Post adjustment'}
          </Button>
          <Badge variant="outline">Posted immutable</Badge>
        </div>
      </form>
    );
  },
});
