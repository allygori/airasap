'use client';

import { useFieldContext } from '../form.hook';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { FieldInfo } from '../partials/field-info';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { Plus, Trash2 } from 'lucide-react';

export type JournalLineFieldValue = {
  account: string;
  debit: string;
  credit: string;
  description: string;
};

export type JournalLineFieldAccount = {
  _id: string;
  code: string;
  name: string;
  type: string;
};

type JournalLinesFieldProps = {
  accounts: JournalLineFieldAccount[];
  lineDirections?: Array<'debit' | 'credit' | undefined>;
  disabled?: boolean;
};

type AccountComboboxItem = JournalLineFieldAccount & {
  label: string;
  value: string;
};

export function JournalLinesField({
  accounts,
  lineDirections,
  disabled,
}: JournalLinesFieldProps) {
  const field = useFieldContext<JournalLineFieldValue[]>();
  const lines = Array.isArray(field.state.value)
    ? field.state.value
    : [];
  const totalDebit = lines.reduce(
    (total, line) => total + Number(line.debit || 0),
    0
  );
  const totalCredit = lines.reduce(
    (total, line) => total + Number(line.credit || 0),
    0
  );
  const difference = totalDebit - totalCredit;
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('id-ID').format(amount);
  const accountItems: AccountComboboxItem[] = accounts.map(
    (account) => ({
      ...account,
      label: `${account.code} · ${account.name}`,
      value: account._id,
    })
  );

  const updateLine = (
    index: number,
    patch: Partial<JournalLineFieldValue>
  ) => {
    field.handleChange(
      lines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line
      )
    );
  };

  return (
    <Field
      data-invalid={
        field.state.meta.isTouched &&
        !field.state.meta.isValid
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <FieldLabel htmlFor={`${field.name}-0-account`}>
            Journal lines
          </FieldLabel>
          <FieldDescription>
            Setiap baris hanya diisi pada satu sisi. Umumnya
            aset dan beban bertambah di debit; modal, utang,
            dan pendapatan bertambah di credit.
          </FieldDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() =>
            field.handleChange([
              ...lines,
              {
                account: '',
                debit: '',
                credit: '',
                description: '',
              },
            ])
          }
        >
          <Plus data-icon="inline-start" /> Tambah baris
        </Button>
      </div>

      <FieldGroup className="flex flex-col gap-3">
        {lines.map((line, index) => (
          <div
            key={`${field.name}-${index}`}
            className="grid gap-3 rounded-lg border p-3 md:grid-cols-[minmax(15rem,2fr)_1fr_1fr_minmax(12rem,1.5fr)_auto] md:items-end"
          >
            <div className="flex items-center justify-between gap-3 md:col-span-5">
              <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Baris {index + 1}
              </span>
              <Badge variant="outline">
                {lineDirections?.[index]
                  ? `Isi ${lineDirections[index]}`
                  : 'Isi debit atau credit'}
              </Badge>
            </div>
            <Field>
              <FieldLabel
                htmlFor={`${field.name}-${index}-account`}
              >
                Akun {index + 1}
              </FieldLabel>
              <Combobox
                items={accountItems}
                value={
                  accountItems.find(
                    (account) =>
                      account.value === line.account
                  ) ?? null
                }
                itemToStringValue={(account) => {
                  const item =
                    account as AccountComboboxItem | null;
                  return item?.label ?? '';
                }}
                onValueChange={(value: unknown) => {
                  const selected =
                    value as AccountComboboxItem | null;
                  updateLine(index, {
                    account: selected?.value ?? '',
                  });
                }}
                disabled={disabled}
              >
                <ComboboxInput
                  id={`${field.name}-${index}-account`}
                  placeholder="Cari kode atau nama akun"
                  showClear
                  aria-label={`Cari akun untuk baris ${index + 1}`}
                />
                <ComboboxContent>
                  <ComboboxEmpty>
                    Akun tidak ditemukan.
                  </ComboboxEmpty>
                  <ComboboxList>
                    {(account: AccountComboboxItem) => (
                      <ComboboxItem
                        key={account.value}
                        value={account}
                      >
                        <span>{account.label}</span>
                        <span className="text-muted-foreground text-xs capitalize">
                          {account.type.replaceAll(
                            '_',
                            ' '
                          )}
                        </span>
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </Field>
            <Field>
              <FieldLabel
                htmlFor={`${field.name}-${index}-debit`}
              >
                Debit
              </FieldLabel>
              <Input
                id={`${field.name}-${index}-debit`}
                type="number"
                min="0"
                step="1"
                value={line.debit}
                placeholder={
                  lineDirections?.[index] === 'credit'
                    ? 'Tidak digunakan'
                    : 'Isi nominal debit'
                }
                aria-label={`Nominal debit baris ${index + 1}`}
                onChange={(event) =>
                  updateLine(index, {
                    debit: event.target.value,
                    credit: '',
                  })
                }
                onBlur={field.handleBlur}
                disabled={
                  disabled ||
                  lineDirections?.[index] === 'credit'
                }
              />
            </Field>
            <Field>
              <FieldLabel
                htmlFor={`${field.name}-${index}-credit`}
              >
                Credit
              </FieldLabel>
              <Input
                id={`${field.name}-${index}-credit`}
                type="number"
                min="0"
                step="1"
                value={line.credit}
                placeholder={
                  lineDirections?.[index] === 'debit'
                    ? 'Tidak digunakan'
                    : 'Isi nominal credit'
                }
                aria-label={`Nominal credit baris ${index + 1}`}
                onChange={(event) =>
                  updateLine(index, {
                    credit: event.target.value,
                    debit: '',
                  })
                }
                onBlur={field.handleBlur}
                disabled={
                  disabled ||
                  lineDirections?.[index] === 'debit'
                }
              />
            </Field>
            <Field>
              <FieldLabel
                htmlFor={`${field.name}-${index}-description`}
              >
                Keterangan
              </FieldLabel>
              <Input
                id={`${field.name}-${index}-description`}
                value={line.description}
                onChange={(event) =>
                  updateLine(index, {
                    description: event.target.value,
                  })
                }
                onBlur={field.handleBlur}
                disabled={disabled}
                placeholder="Opsional"
              />
            </Field>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Hapus baris ${index + 1}`}
              disabled={disabled || lines.length <= 2}
              onClick={() =>
                field.handleChange(
                  lines.filter(
                    (_, lineIndex) => lineIndex !== index
                  )
                )
              }
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </FieldGroup>
      <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <span>
            Total debit:{' '}
            <strong>{formatAmount(totalDebit)}</strong>
          </span>
          <span>
            Total credit:{' '}
            <strong>{formatAmount(totalCredit)}</strong>
          </span>
        </div>
        <Badge
          variant={
            difference === 0 ? 'secondary' : 'destructive'
          }
        >
          {difference === 0
            ? 'Seimbang'
            : `Selisih ${formatAmount(Math.abs(difference))}`}
        </Badge>
      </div>
      <FieldInfo field={field} />
    </Field>
  );
}
