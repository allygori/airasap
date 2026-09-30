/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import { useStore } from '@tanstack/react-form';
import { formatIDR as formatMoney } from '@/lib/number/money';
import { z } from 'zod';
import { withForm } from '@/components/form/form.hook';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';

export type PurchaseItemOption = {
  id: string;
  sku: string;
  name: string;
  unit: string;
};

export type PurchaseLocationOption = {
  id: string;
  code: string;
  name: string;
};

export type PurchaseAccountOption = {
  id: string;
  code: string;
  name: string;
  subtype: string | null;
};

const PurchaseLineFormSchema = z.object({
  line_key: z.string().min(1),
  item_id: z.string().min(1, 'Pilih item inventory.'),
  location_id: z
    .string()
    .min(1, 'Pilih lokasi penyimpanan.'),
  quantity: z
    .string()
    .regex(/^\d+$/, 'Masukkan jumlah dalam angka bulat.')
    .refine(
      (value) =>
        Number(value) > 0 && Number(value) <= 1_000_000,
      'Jumlah harus antara 1 dan 1.000.000.'
    ),
  unit_cost: z
    .string()
    .regex(/^\d+$/, 'Masukkan harga dalam angka bulat.')
    .refine(
      (value) =>
        Number(value) > 0 && Number(value) <= 1_000_000_000,
      'Harga harus antara 1 dan 1.000.000.000.'
    ),
});

export const FinancePurchaseFormSchema = z
  .object({
    supplier_name: z.string().max(160),
    supplier_reference: z.string().max(120),
    transaction_date: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        'Pilih tanggal transaksi.'
      ),
    payment_timing: z.enum(['paid', 'payable']),
    payment_account_id: z.string(),
    lines: z
      .array(PurchaseLineFormSchema)
      .min(1, 'Tambahkan minimal satu barang.')
      .max(100, 'Purchase maksimal berisi 100 barang.'),
    notes: z.string().max(500),
  })
  .superRefine((values, context) => {
    if (
      values.payment_timing === 'paid' &&
      !values.payment_account_id
    ) {
      context.addIssue({
        code: 'custom',
        path: ['payment_account_id'],
        message: 'Pilih akun Kas/Bank untuk pembayaran.',
      });
    }

    const total = values.lines.reduce(
      (sum, line) =>
        sum +
        Number(line.quantity) * Number(line.unit_cost),
      0
    );
    if (!Number.isSafeInteger(total)) {
      context.addIssue({
        code: 'custom',
        path: ['lines'],
        message:
          'Total purchase melebihi batas nominal yang aman.',
      });
    }
  });

export type FinancePurchaseFormValues = z.input<
  typeof FinancePurchaseFormSchema
>;

export type PurchaseFormIntent = 'draft' | 'post';

export type PurchaseFormDefaultsInput = {
  items: PurchaseItemOption[];
  locations: PurchaseLocationOption[];
  paymentAccounts: PurchaseAccountOption[];
};

export function createPurchaseFormDefaults({
  items,
  locations,
  paymentAccounts,
}: PurchaseFormDefaultsInput): FinancePurchaseFormValues {
  return {
    supplier_name: '',
    supplier_reference: '',
    transaction_date: new Date().toISOString().slice(0, 10),
    payment_timing: 'paid',
    payment_account_id: paymentAccounts[0]?.id ?? '',
    lines: [
      createPurchaseLine(
        items[0]?.id ?? '',
        locations[0]?.id ?? ''
      ),
    ],
    notes: '',
  };
}

type FinancePurchaseFormProps = {
  items: PurchaseItemOption[];
  locations: PurchaseLocationOption[];
  paymentAccounts: PurchaseAccountOption[];
  isSubmitting: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onSubmitIntent: (intent: PurchaseFormIntent) => void;
};

export const PurchaseForm = withForm({
  defaultValues: {
    supplier_name: '',
    supplier_reference: '',
    transaction_date: '',
    payment_timing: 'paid',
    payment_account_id: '',
    lines: [createPurchaseLine('', '')],
    notes: '',
  } as FinancePurchaseFormValues,
  props: {
    items: [],
    locations: [],
    paymentAccounts: [],
    isSubmitting: false,
    errorMessage: null,
    successMessage: null,
    onSubmitIntent: () => undefined,
  } as FinancePurchaseFormProps,
  render: function Render({
    form,
    items,
    locations,
    paymentAccounts,
    isSubmitting,
    errorMessage,
    successMessage,
    onSubmitIntent,
  }) {
    const lines = useStore(
      form.store,
      (state) => state.values.lines
    );
    const paymentTiming = useStore(
      form.store,
      (state) => state.values.payment_timing
    );
    const totalAmount = lines.reduce(
      (total, line) =>
        total +
        Number(line.quantity || 0) *
          Number(line.unit_cost || 0),
      0
    );

    const addLine = () => {
      form.setFieldValue('lines', (current) => [
        ...current,
        createPurchaseLine(
          items[0]?.id ?? '',
          locations[0]?.id ?? '',
          crypto.randomUUID()
        ),
      ]);
    };

    const removeLine = (index: number) => {
      form.setFieldValue('lines', (current) =>
        current.filter(
          (_, lineIndex) => lineIndex !== index
        )
      );
    };

    return (
      <form
        className="grid min-w-0 gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onSubmitIntent('post');
        }}
      >
        <FieldGroup className="grid min-w-0 gap-5 md:grid-cols-2">
          <form.AppField
            name="supplier_name"
            children={(field) => (
              <field.TextField
                label="Supplier (opsional)"
                maxLength={160}
                placeholder="Contoh: PT Distributor Nusantara"
                className="min-w-0"
              />
            )}
          />
          <form.AppField
            name="supplier_reference"
            children={(field) => (
              <field.TextField
                label="No. invoice / referensi"
                maxLength={120}
                placeholder="Contoh: INV-2026-001"
                className="min-w-0"
              />
            )}
          />
          <form.AppField
            name="transaction_date"
            children={(field) => (
              <field.DateField
                label="Tanggal transaksi"
                valueType="string"
                placeholder="Pilih tanggal"
                required
                className="min-w-0"
                buttonClassName="w-full"
              />
            )}
          />
          <form.AppField
            name="payment_timing"
            children={(field) => (
              <field.SelectField
                label="Waktu pembayaran"
                placeholder="Pilih waktu pembayaran"
                className="min-w-0"
                items={[
                  { label: 'Sudah dibayar', value: 'paid' },
                  {
                    label: 'Jadi Utang Usaha',
                    value: 'payable',
                  },
                ]}
              />
            )}
          />
        </FieldGroup>

        {paymentTiming === 'paid' ? (
          <form.AppField
            name="payment_account_id"
            children={(field) => (
              <field.SelectField
                label="Dibayar dari"
                placeholder="Pilih akun Kas/Bank"
                className="min-w-0"
                items={paymentAccounts.map((account) => ({
                  label: `${account.code} — ${account.name}`,
                  value: account.id,
                }))}
              />
            )}
          />
        ) : (
          <div className="border-info/30 bg-info/5 text-info-foreground rounded-lg border px-4 py-3 text-sm leading-6">
            Purchase akan dicatat ke Utang Usaha 2100.
            Pembayaran supplier akan ditambahkan pada phase
            settlement/payables.
          </div>
        )}

        <section
          className="grid min-w-0 gap-4"
          aria-labelledby="purchase-lines-title"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2
                id="purchase-lines-title"
                className="text-sm font-semibold"
              >
                Barang yang dibeli
              </h2>
              <p className="text-muted-foreground text-xs leading-5">
                Setiap line menjadi inventory movement
                purchase saat diposting.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isSubmitting || lines.length >= 100}
              onClick={addLine}
              className="self-start sm:self-auto"
            >
              + Tambah barang
            </Button>
          </div>

          <div className="grid min-w-0 gap-4">
            {lines.map((line, index) => (
              <div
                key={line.line_key}
                className="bg-muted/25 grid min-w-0 gap-4 rounded-xl border p-4 sm:p-5"
              >
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      Barang {index + 1}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Pilih item, lokasi, jumlah, dan harga
                      per unit.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={
                      isSubmitting || lines.length === 1
                    }
                    onClick={() => removeLine(index)}
                    aria-label={`Hapus barang ${index + 1}`}
                  >
                    Hapus
                  </Button>
                </div>

                <FieldGroup className="grid min-w-0 gap-4 sm:grid-cols-2">
                  <form.AppField
                    name={
                      `lines[${index}].item_id` as const
                    }
                    children={(field) => (
                      <field.SelectField
                        label="Item inventory"
                        placeholder="Pilih item"
                        className="min-w-0"
                        remote={{
                          url: '/api/v1/dashboard/finance/inventory/stock',
                          resultsKey: 'data.items',
                          valueKey: 'item_id',
                          labelKey: ['sku', 'name'],
                          searchParam: 'search',
                          limit: 100,
                        }}
                        items={items.map((item) => ({
                          label: `${item.sku} — ${item.name}`,
                          value: item.id,
                        }))}
                      />
                    )}
                  />
                  <form.AppField
                    name={
                      `lines[${index}].location_id` as const
                    }
                    children={(field) => (
                      <field.SelectField
                        label="Lokasi penyimpanan"
                        placeholder="Pilih lokasi"
                        className="min-w-0"
                        items={locations.map(
                          (location) => ({
                            label: `${location.code} — ${location.name}`,
                            value: location.id,
                          })
                        )}
                      />
                    )}
                  />
                  <form.AppField
                    name={
                      `lines[${index}].quantity` as const
                    }
                    children={(field) => (
                      <field.TextField
                        label="Jumlah"
                        type="number"
                        min={1}
                        max={1_000_000}
                        step={1}
                        inputMode="numeric"
                        placeholder="1"
                        className="min-w-0"
                      />
                    )}
                  />
                  <form.AppField
                    name={
                      `lines[${index}].unit_cost` as const
                    }
                    children={(field) => (
                      <field.MoneyField
                        label="Harga per unit"
                        type="number"
                        min={1}
                        max={1_000_000_000}
                        step={1}
                        inputMode="numeric"
                        placeholder="25000"
                        className="min-w-0"
                      />
                    )}
                  />
                </FieldGroup>

                <div className="border-t pt-3 text-right">
                  <span className="text-muted-foreground text-xs">
                    Subtotal
                  </span>
                  <p className="font-mono text-sm font-semibold">
                    {formatMoney(
                      Number(line.quantity || 0) *
                        Number(line.unit_cost || 0)
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <FieldGroup className="grid min-w-0 gap-5 md:grid-cols-2">
          <form.AppField
            name="notes"
            children={(field) => (
              <field.TextareaField
                label="Catatan (opsional)"
                maxLength={500}
                rows={3}
                placeholder="Catatan penerimaan barang"
                className="min-w-0"
              />
            )}
          />
          <div className="bg-primary/5 border-primary/20 flex min-w-0 flex-col justify-center rounded-xl border p-5">
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase">
              Total purchase
            </p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight break-words">
              {formatMoney(totalAmount)}
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              Tidak termasuk pajak pada phase ini.
            </p>
          </div>
        </FieldGroup>

        {errorMessage ? (
          <div
            role="alert"
            className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm"
          >
            {errorMessage}
          </div>
        ) : null}
        {successMessage ? (
          <div
            role="status"
            className="border-success/30 bg-success/10 text-success rounded-lg border px-4 py-3 text-sm"
          >
            {successMessage}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onSubmitIntent('draft')}
          >
            Simpan draft
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || totalAmount <= 0}
          >
            {isSubmitting ? 'Memproses…' : 'Simpan & post'}
          </Button>
          <Badge variant="outline">
            Inventory + journal seimbang
          </Badge>
        </div>
      </form>
    );
  },
});

function createPurchaseLine(
  itemId: string,
  locationId: string,
  lineKey = 'purchase-line-initial'
) {
  return {
    line_key: lineKey,
    item_id: itemId,
    location_id: locationId,
    quantity: '1',
    unit_cost: '',
  };
}
