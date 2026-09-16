'use client';

import { useFieldContext } from '../form.hook';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import { FieldInfo } from '../partials/field-info';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  disabled?: boolean;
};

export function JournalLinesField({
  accounts,
  disabled,
}: JournalLinesFieldProps) {
  const field = useFieldContext<JournalLineFieldValue[]>();
  const lines = Array.isArray(field.state.value)
    ? field.state.value
    : [];

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
            Isi satu sisi debit atau credit untuk setiap
            baris. Minimal dua baris.
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

      <div className="flex flex-col gap-3">
        {lines.map((line, index) => (
          <div
            key={`${field.name}-${index}`}
            className="grid gap-3 rounded-lg border p-3 md:grid-cols-[minmax(15rem,2fr)_1fr_1fr_minmax(12rem,1.5fr)_auto] md:items-end"
          >
            <Field>
              <FieldLabel
                htmlFor={`${field.name}-${index}-account`}
              >
                Akun {index + 1}
              </FieldLabel>
              <Select
                value={line.account || null}
                onValueChange={(value) =>
                  updateLine(index, {
                    account: value || '',
                  })
                }
                disabled={disabled}
              >
                <SelectTrigger
                  id={`${field.name}-${index}-account`}
                  className="w-full"
                >
                  <SelectValue placeholder="Pilih akun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {accounts.map((account) => (
                      <SelectItem
                        key={account._id}
                        value={account._id}
                      >
                        <span>
                          {account.code} · {account.name}
                        </span>
                        <span className="text-muted-foreground text-xs capitalize">
                          {account.type.replaceAll(
                            '_',
                            ' '
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
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
                onChange={(event) =>
                  updateLine(index, {
                    debit: event.target.value,
                    credit: '',
                  })
                }
                onBlur={field.handleBlur}
                disabled={disabled}
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
                onChange={(event) =>
                  updateLine(index, {
                    credit: event.target.value,
                    debit: '',
                  })
                }
                onBlur={field.handleBlur}
                disabled={disabled}
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
      </div>
      <FieldInfo field={field} />
    </Field>
  );
}
