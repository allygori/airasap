'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  revalidateLogic,
  useStore,
} from '@tanstack/react-form';
import { z } from 'zod';
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
  UpdateFinanceCalendarSettingsSchema,
  UpdateFinanceShopeePayoutSettingsSchema,
  type FinanceStatus,
} from '@/modules/finance/onboarding/finance-onboarding.schema';

type FinancePayoutAccountOption = {
  id: string;
  code: string;
  name: string;
  subtype: 'bank' | 'e_wallet';
};

type FinanceSettingsFormProps = {
  initialValues: {
    calendar_timezone: TimeZone;
    shopee_payout_account_id: string | null;
  };
  payoutAccounts: FinancePayoutAccountOption[];
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
  payoutAccounts,
  status,
}: FinanceSettingsFormProps) {
  const [notice, setNotice] =
    useState<FinanceSettingsNotice | null>(null);
  const [payoutNotice, setPayoutNotice] =
    useState<FinanceSettingsNotice | null>(null);
  const canEdit = status === 'in_progress';
  const canEditPayoutAccount =
    status === 'in_progress' || status === 'active';

  const form = useAppForm({
    defaultValues: {
      calendar_timezone: initialValues.calendar_timezone,
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: UpdateFinanceCalendarSettingsSchema,
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

  const payoutForm = useAppForm({
    defaultValues: {
      shopee_payout_account_id:
        initialValues.shopee_payout_account_id ?? '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: z
        .object({ shopee_payout_account_id: z.string() })
        .strict(),
    },
    onSubmit: async ({ value }) => {
      setPayoutNotice(null);
      const update =
        UpdateFinanceShopeePayoutSettingsSchema.safeParse(
          value
        );
      if (!update.success) {
        setPayoutNotice({
          kind: 'error',
          message:
            'Pilih akun bank atau e-wallet terlebih dahulu.',
        });
        return;
      }

      try {
        const response = await fetch(
          '/api/v1/dashboard/finance/settings',
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(update.data),
          }
        );
        const payload: unknown = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          setPayoutNotice({
            kind: 'error',
            message:
              getErrorMessage(payload) ??
              'Akun tujuan payout gagal disimpan. Silakan coba lagi.',
          });
          return;
        }

        payoutForm.reset(value);
        setPayoutNotice({
          kind: 'success',
          message:
            'Akun tujuan payout Shopee berhasil diperbarui.',
        });
      } catch {
        setPayoutNotice({
          kind: 'error',
          message:
            'Akun tujuan payout gagal disimpan. Periksa koneksi lalu coba lagi.',
        });
      }
    },
  });
  const selectedPayoutAccountId = useStore(
    payoutForm.store,
    (state) => state.values.shopee_payout_account_id
  );

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

      <Card>
        <CardHeader>
          <CardTitle>Akun tujuan payout Shopee</CardTitle>
          <CardDescription>
            Dipakai sebagai akun penerima default saat
            mencatat payout Shopee. Pengaturan ini hanya
            untuk pembukuan Airasap dan tidak mengubah
            rekening pencairan di Shopee.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void payoutForm.handleSubmit();
            }}
            className="flex flex-col gap-6"
          >
            <FieldGroup>
              <div className="text-muted-foreground grid gap-2 text-sm">
                <p>
                  Akun pertama yang ditambahkan saat
                  onboarding menjadi default awal. Anda
                  dapat menggantinya di sini kapan saja.
                </p>
                <p>
                  Pilihan ini hanya digunakan sebagai
                  default pembukuan jika data payout tidak
                  menyebutkan akun penerima. Ini tidak
                  mengubah pengaturan pencairan di Shopee.
                </p>
              </div>
              <Field data-disabled={!canEditPayoutAccount}>
                <FieldLabel htmlFor="shopee-payout-account">
                  Akun penerima default
                </FieldLabel>
                <Select
                  value={selectedPayoutAccountId}
                  disabled={
                    !canEditPayoutAccount ||
                    payoutAccounts.length === 0
                  }
                  onValueChange={(value) => {
                    if (typeof value === 'string') {
                      payoutForm.setFieldValue(
                        'shopee_payout_account_id',
                        value
                      );
                    }
                  }}
                >
                  <SelectTrigger
                    id="shopee-payout-account"
                    className="w-full"
                  >
                    <SelectValue placeholder="Pilih akun penerima" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {payoutAccounts.map((account) => (
                        <SelectItem
                          key={account.id}
                          value={account.id}
                        >
                          {account.name} (
                          {account.subtype === 'bank'
                            ? 'Bank'
                            : 'E-wallet'}
                          )
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Rekening bank dan e-wallet tetap dicatat
                  sebagai akun terpisah. Pilih akun yang
                  paling sering menerima payout Shopee.
                  {payoutAccounts.length === 0 &&
                  status === 'in_progress' ? (
                    <>
                      {' '}
                      <Link
                        href="/dashboard/finance/onboarding"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        Buka onboarding Finance
                      </Link>{' '}
                      untuk menambahkan akun.
                    </>
                  ) : null}
                </FieldDescription>
              </Field>
            </FieldGroup>

            {payoutNotice && (
              <p
                role={
                  payoutNotice.kind === 'error'
                    ? 'alert'
                    : 'status'
                }
                className={
                  payoutNotice.kind === 'error'
                    ? 'text-destructive text-sm'
                    : 'text-success text-sm'
                }
              >
                {payoutNotice.message}
              </p>
            )}

            {canEditPayoutAccount && (
              <payoutForm.Subscribe
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
                        payoutForm.reset();
                        setPayoutNotice(null);
                      }}
                    >
                      Batalkan
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        !isDirty ||
                        isSubmitting ||
                        payoutAccounts.length === 0
                      }
                    >
                      {isSubmitting && (
                        <Spinner className="mr-2" />
                      )}
                      Simpan akun payout
                    </Button>
                  </div>
                )}
              </payoutForm.Subscribe>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
