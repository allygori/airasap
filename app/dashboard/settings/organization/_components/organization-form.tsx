'use client';

import { useState } from 'react';
import { revalidateLogic } from '@tanstack/react-form';

import { useAppForm } from '@/components/form/form.hook';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import {
  UpdateOrganizationProfileSchema,
  type UpdateOrganizationProfileInput,
} from '@/lib/auth/organization-profile.schema';

type OrganizationFormProps = {
  initialName: string;
};

type OrganizationNotice = {
  kind: 'error' | 'success';
  message: string;
};

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

export function OrganizationForm({
  initialName,
}: OrganizationFormProps) {
  const [notice, setNotice] =
    useState<OrganizationNotice | null>(null);

  const form = useAppForm({
    defaultValues: {
      name: initialName,
    } as UpdateOrganizationProfileInput,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: UpdateOrganizationProfileSchema,
    },
    onSubmit: async ({ value }) => {
      setNotice(null);

      try {
        const response = await fetch(
          '/api/v1/dashboard/settings/organization',
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
              'Organisasi gagal diperbarui. Silakan coba lagi.',
          });
          return;
        }

        const nextName = value.name.trim();
        form.reset({ name: nextName });
        setNotice({
          kind: 'success',
          message: 'Nama organisasi berhasil diperbarui.',
        });
      } catch {
        setNotice({
          kind: 'error',
          message:
            'Organisasi gagal diperbarui. Periksa koneksi lalu coba lagi.',
        });
      }
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">
          Organisasi
        </h2>
        <p className="text-muted-foreground text-sm">
          Kelola identitas organisasi yang menaungi toko dan
          data kerja Anda.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Informasi organisasi</CardTitle>
          <CardDescription>
            Perbarui nama tampilan organisasi. Form ini
            hanya mengubah identitas organisasi.
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
                    label="Nama organisasi"
                    description="Nama ini membantu mengenali workspace Anda."
                    placeholder="Masukkan nama organisasi"
                    maxLength={100}
                  />
                )}
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
