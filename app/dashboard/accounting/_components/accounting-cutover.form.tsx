/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import { withForm } from '@/components/form/form.hook';
import { FieldGroup } from '@/components/ui/field';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { z } from 'zod';

const CutoverLineFormSchema = z.object({
  account: z.string().min(1, 'Akun wajib dipilih.'),
  debit: z.string(),
  credit: z.string(),
  description: z.string(),
});

export const AccountingCutoverFormSchema = z.object({
  effective_date: z
    .string()
    .min(1, 'Tanggal cutover wajib diisi.'),
  description: z
    .string()
    .trim()
    .min(1, 'Keterangan wajib diisi.'),
  lines: z
    .array(CutoverLineFormSchema)
    .min(2, 'Opening balance minimal memiliki dua baris.')
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

type AccountingCutoverFormProps = {
  accounts: AccountOption[];
  title?: string;
  description?: string;
  onCancel?: () => void;
};

export const AccountingCutoverForm = withForm({
  defaultValues: {
    effective_date: new Date().toISOString().slice(0, 10),
    description: '',
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
  } as z.input<typeof AccountingCutoverFormSchema>,
  props: {
    accounts: [] as AccountOption[],
    title: undefined,
    description: undefined,
    onCancel: undefined,
  } as AccountingCutoverFormProps,
  render: function Render({
    form,
    accounts,
    title,
    description,
    onCancel,
  }) {
    return (
      <form
        id="accounting-cutover-form"
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
              {title || 'Accounting cutover'}
            </CardTitle>
            <CardDescription>
              {description ||
                'Mulai pembukuan dari saldo terverifikasi pada tanggal tertentu tanpa mengulang seluruh transaksi lama.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-5">
              <form.AppField
                name="effective_date"
                children={(field) => (
                  <field.TextField
                    label="Tanggal mulai accounting"
                    type="date"
                    description="Period bulan ini akan dibuat jika belum tersedia dan tetap harus terbuka."
                  />
                )}
              />
              <form.AppField
                name="description"
                children={(field) => (
                  <field.TextareaField
                    label="Keterangan cutover"
                    placeholder="Contoh: Saldo awal usaha per 1 April 2026"
                  />
                )}
              />
              <Alert className="bg-primary/5 border-primary/20">
                <Info />
                <AlertTitle>
                  Gunakan saldo terverifikasi
                </AlertTitle>
                <AlertDescription>
                  Isi kas, bank, piutang, inventory, utang,
                  dan modal yang benar-benar ada pada
                  tanggal cutover. Total debit dan credit
                  harus seimbang.
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
              <form.SubmitButton text="Simpan opening balance" />
            </form.AppForm>
          </CardFooter>
        </Card>
      </form>
    );
  },
});
