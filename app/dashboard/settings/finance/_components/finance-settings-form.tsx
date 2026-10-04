'use client';

import Link from 'next/link';
import { useState } from 'react';
import { revalidateLogic } from '@tanstack/react-form';
import {
  TIMEZONES,
  TIMEZONE_VALUES,
  type TimeZone,
} from '@/constant/timezone';
import { useAppForm } from '@/components/form/form.hook';
import { FieldInfo } from '@/components/form/partials/field-info';
import { Badge } from '@/components/ui/badge';
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
  UpdateFinanceSettingsSchema,
  type FinanceStatus,
  type FinanceSettingsUpdate,
} from '@/modules/finance/onboarding/finance-onboarding.schema';

type FinanceSettingsFormProps = {
  initialValues: FinanceSettingsUpdate;
  status: FinanceStatus;
};

type FinanceSettingsNotice = {
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

const statusLabels: Record<FinanceStatus, string> = {
  not_started: 'Belum dimulai',
  in_progress: 'Dalam setup',
  blocked: 'Perlu ditinjau',
  active: 'Aktif',
};

function getSettingsDescription(status: FinanceStatus) {
  if (status === 'not_started') {
    return 'Mulai setup Finance untuk mengatur zona waktu kalender.';
  }
  if (status === 'active') {
    return 'Zona waktu dikunci setelah Finance aktif karena digunakan untuk menentukan periode dan tanggal laporan.';
  }
  if (status === 'blocked') {
    return 'Pengaturan dikunci selama setup Finance perlu ditinjau.';
  }
  return 'Zona waktu menentukan batas tanggal dan periode Finance. Setelah jurnal pertama dibuat, zona waktu tidak dapat diubah.';
}

export function FinanceSettingsForm({
  initialValues,
  status,
}: FinanceSettingsFormProps) {
  const [notice, setNotice] =
    useState<FinanceSettingsNotice | null>(null);
  const canEdit = status === 'in_progress';

  const form = useAppForm({
    defaultValues: initialValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: UpdateFinanceSettingsSchema,
    },
    onSubmit: async ({ value }) => {
      setNotice(null);

      try {
        const response = await fetch(
          '/api/v1/dashboard/finance/settings',
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
              'Pengaturan Finance gagal disimpan. Silakan coba lagi.',
          });
          return;
        }

        form.reset({
          calendar_timezone: value.calendar_timezone,
        });
        setNotice({
          kind: 'success',
          message:
            'Zona waktu Finance berhasil diperbarui.',
        });
      } catch {
        setNotice({
          kind: 'error',
          message:
            'Pengaturan Finance gagal disimpan. Periksa koneksi lalu coba lagi.',
        });
      }
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Finance
          </h2>
          <p className="text-muted-foreground text-sm">
            Kelola konfigurasi kalender untuk pembukuan dan
            laporan Finance.
          </p>
        </div>
        <Badge variant="outline">
          {statusLabels[status]}
        </Badge>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Kalender Finance</CardTitle>
          <CardDescription>
            Pengaturan ini berlaku di seluruh organisasi dan
            digunakan oleh periode akuntansi.
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
              <form.AppField name="calendar_timezone">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched &&
                    !field.state.meta.isValid;

                  return (
                    <Field
                      data-invalid={isInvalid}
                      data-disabled={!canEdit}
                    >
                      <FieldLabel htmlFor={field.name}>
                        Zona waktu kalender
                      </FieldLabel>
                      <Select
                        value={field.state.value}
                        disabled={!canEdit}
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
                        {getSettingsDescription(status)}
                      </FieldDescription>
                      <FieldInfo field={field} />
                    </Field>
                  );
                }}
              </form.AppField>
            </FieldGroup>

            {status === 'not_started' && (
              <div className="flex justify-end">
                <Button
                  render={
                    <Link href="/dashboard/finance/onboarding" />
                  }
                >
                  Mulai setup Finance
                </Button>
              </div>
            )}

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

            {canEdit && (
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
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
