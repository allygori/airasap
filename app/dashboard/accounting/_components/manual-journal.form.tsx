/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import { withForm } from '@/components/form/form.hook';
import { FieldGroup } from '@/components/ui/field';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { z } from 'zod';

const JournalLineFormSchema = z.object({
  account: z.string().min(1, 'Akun wajib dipilih.'),
  debit: z.string(),
  credit: z.string(),
  description: z.string(),
});

export const ManualJournalFormSchema = z.object({
  transaction_date: z
    .string()
    .min(1, 'Tanggal wajib diisi.'),
  description: z
    .string()
    .trim()
    .min(1, 'Keterangan wajib diisi.'),
  store_id: z.string(),
  lines: z
    .array(JournalLineFormSchema)
    .min(2, 'Journal minimal memiliki dua baris.')
    .superRefine((lines, context) => {
      let debit = 0;
      let credit = 0;

      lines.forEach((line, index) => {
        const debitValue = Number(line.debit || 0);
        const creditValue = Number(line.credit || 0);
        debit += debitValue;
        credit += creditValue;

        if (
          !Number.isInteger(debitValue) ||
          !Number.isInteger(creditValue) ||
          debitValue < 0 ||
          creditValue < 0
        ) {
          context.addIssue({
            code: 'custom',
            path: [index],
            message:
              'Nilai harus berupa angka bulat non-negatif.',
          });
        }

        if (
          (debitValue > 0 && creditValue > 0) ||
          (debitValue === 0 && creditValue === 0)
        ) {
          context.addIssue({
            code: 'custom',
            path: [index],
            message: 'Isi debit atau credit saja.',
          });
        }
      });

      if (debit !== credit) {
        context.addIssue({
          code: 'custom',
          path: [],
          message:
            'Total debit harus sama dengan total credit.',
        });
      }
    }),
});

type AccountOption = {
  _id: string;
  code: string;
  name: string;
  type: string;
};

type StoreOption = {
  id: string;
  name: string;
  code: string | null;
};

type ManualJournalFormProps = {
  accounts: AccountOption[];
  stores: StoreOption[];
  title?: string;
  description?: string;
  onCancel?: () => void;
};

export const ManualJournalForm = withForm({
  defaultValues: {
    transaction_date: new Date().toISOString().slice(0, 10),
    description: '',
    store_id: '',
    lines: [
      {
        account: '',
        debit: '',
        credit: '',
        description: '',
      },
      {
        account: '',
        debit: '',
        credit: '',
        description: '',
      },
    ],
  } as z.input<typeof ManualJournalFormSchema>,
  props: {
    accounts: [] as AccountOption[],
    stores: [] as StoreOption[],
    title: undefined,
    description: undefined,
    onCancel: undefined,
  } as ManualJournalFormProps,
  render: function Render({
    form,
    accounts,
    stores,
    title,
    description,
    onCancel,
  }) {
    return (
      <form
        id="manual-journal-form"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
        className="flex flex-col gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>
              {title || 'Manual journal'}
            </CardTitle>
            <CardDescription>
              {description ||
                'Catat transaksi yang belum memiliki widget operasional khusus melalui double-entry.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <form.AppField
                  name="transaction_date"
                  children={(field) => (
                    <field.TextField
                      label="Tanggal transaksi"
                      type="date"
                    />
                  )}
                />
                <form.AppField
                  name="store_id"
                  children={(field) => (
                    <field.SelectField
                      label="Scope store/workspace"
                      placeholder="Organization-wide"
                      description="Pilih store jika transaksi hanya milik satu workspace. Kosongkan untuk level organisasi."
                      items={stores.map((store) => ({
                        label: `${store.code ? `${store.code} · ` : ''}${store.name}`,
                        value: store.id,
                      }))}
                    />
                  )}
                />
              </div>
              <form.AppField
                name="description"
                children={(field) => (
                  <field.TextareaField
                    label="Keterangan"
                    placeholder="Contoh: Setoran modal tambahan bulan ini"
                  />
                )}
              />
              <Alert className="bg-primary/5 border-primary/20">
                <Info />
                <AlertTitle>
                  Journal akan langsung diposting
                </AlertTitle>
                <AlertDescription>
                  Pastikan akun, nominal, tanggal, dan scope
                  sudah benar. Journal posted tidak diedit
                  langsung; koreksi dilakukan melalui
                  reversal.
                </AlertDescription>
              </Alert>
              <form.AppField
                name="lines"
                children={(field) => (
                  <field.JournalLinesField
                    accounts={accounts}
                  />
                )}
              />
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 border-t sm:flex-row sm:justify-end">
            {onCancel ? (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Batal
              </Button>
            ) : null}
            <form.AppForm>
              <form.SubmitButton text="Post manual journal" />
            </form.AppForm>
          </CardFooter>
        </Card>
      </form>
    );
  },
});
