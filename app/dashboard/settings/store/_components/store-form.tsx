'use client';

import { useState } from 'react';
import { revalidateLogic } from '@tanstack/react-form';
import {
  TIMEZONES,
  TIMEZONE_VALUES,
  type TimeZone,
} from '@/constant/timezone';
import { useAppForm } from '@/components/form/form.hook';
import { FieldInfo } from '@/components/form/partials/field-info';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import {
  UpdateStoreSchema,
  type UpdateStoreDTO,
} from '@/modules/stores/store.dto';

type StoreFormProps = {
  storeId: string;
  initialValues: {
    name: string;
    code: string;
    timezone: TimeZone;
  };
};

type StoreNotice = {
  kind: 'error' | 'success';
  message: string;
};

const timezoneOptions = Object.values(TIMEZONES);

function isTimeZone(value: string): value is TimeZone {
  return TIMEZONE_VALUES.some(
    (timezone) => timezone === value
  );
}

function getErrorMessage(
  payload: unknown
): string | undefined {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('error' in payload)
  ) {
    return undefined;
  }

  const error = payload.error;
  if (
    !error ||
    typeof error !== 'object' ||
    !('message' in error)
  ) {
    return undefined;
  }

  return typeof error.message === 'string'
    ? error.message
    : undefined;
}

export function StoreForm({
  storeId,
  initialValues,
}: StoreFormProps) {
  const [notice, setNotice] = useState<StoreNotice | null>(
    null
  );

  const form = useAppForm({
    defaultValues: initialValues as UpdateStoreDTO,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: UpdateStoreSchema,
    },
    onSubmit: async ({ value }) => {
      setNotice(null);

      try {
        const response = await fetch(
          `/api/v1/dashboard/stores/${storeId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(value),
          }
        );
        const payload: unknown = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          setNotice({
            kind: 'error',
            message:
              getErrorMessage(payload) ??
              'Toko gagal diperbarui. Silakan coba lagi.',
          });
          return;
        }

        const nextValues = {
          name: value.name?.trim() ?? '',
          code: value.code?.trim() ?? '',
          timezone:
            value.timezone ?? initialValues.timezone,
        };
        form.reset(nextValues);
        setNotice({
          kind: 'success',
          message: 'Pengaturan toko berhasil diperbarui.',
        });
      } catch {
        setNotice({
          kind: 'error',
          message:
            'Toko gagal diperbarui. Periksa koneksi lalu coba lagi.',
        });
      }
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">
          Toko
        </h2>
        <p className="text-muted-foreground text-sm">
          Kelola nama, kode, dan zona waktu toko aktif.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Informasi toko</CardTitle>
          <CardDescription>
            Perubahan hanya berlaku untuk toko aktif pada
            sesi ini. Data historis tidak diubah.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
            className="flex flex-col gap-6"
          >
            <FieldGroup>
              <form.AppField name="name">
                {(field) => (
                  <field.TextField
                    label="Nama toko"
                    description="Nama tampilan untuk toko aktif."
                    placeholder="Masukkan nama toko"
                    maxLength={160}
                  />
                )}
              </form.AppField>

              <form.AppField name="code">
                {(field) => (
                  <field.TextField
                    label="Kode toko"
                    description="Kode pengenal toko."
                    placeholder="Masukkan kode toko"
                    maxLength={64}
                  />
                )}
              </form.AppField>

              <form.AppField name="timezone">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched &&
                    !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Zona waktu
                      </FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) => {
                          if (
                            typeof value === 'string' &&
                            isTimeZone(value)
                          ) {
                            field.handleChange(value);
                          }
                        }}
                      >
                        <SelectTrigger
                          id={field.name}
                          aria-invalid={isInvalid}
                          className="w-full"
                        >
                          <SelectValue placeholder="Pilih zona waktu" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {timezoneOptions.map(
                              (option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              )
                            )}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        Digunakan untuk menafsirkan tanggal
                        operasional toko.
                      </FieldDescription>
                      <FieldInfo field={field} />
                    </Field>
                  );
                }}
              </form.AppField>
            </FieldGroup>

            {notice && (
              <p
                role={
                  notice.kind === 'error'
                    ? 'alert'
                    : 'status'
                }
                className={
                  notice.kind === 'error'
                    ? 'text-destructive text-sm'
                    : 'text-success text-sm'
                }
              >
                {notice.message}
              </p>
            )}

            <form.Subscribe
              selector={(state) => ({
                isDirty: state.isDirty,
                isSubmitting: state.isSubmitting,
              })}
            >
              {({ isDirty, isSubmitting }) => (
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!isDirty || isSubmitting}
                    onClick={() => {
                      form.reset();
                      setNotice(null);
                    }}
                  >
                    Batalkan
                  </Button>
                  <Button
                    type="submit"
                    disabled={!isDirty || isSubmitting}
                  >
                    {isSubmitting && (
                      <Spinner className="mr-2" />
                    )}
                    Simpan perubahan
                  </Button>
                </div>
              )}
            </form.Subscribe>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
