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
  UpdateProfileSchema,
  type UpdateProfileInput,
} from '@/lib/auth/profile.schema';
import { authClient } from '@/lib/auth/auth-client';

type ProfileFormProps = {
  initialName: string;
  email: string;
};

type ProfileNotice = {
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

export function ProfileForm({
  initialName,
  email,
}: ProfileFormProps) {
  const [notice, setNotice] =
    useState<ProfileNotice | null>(null);
  const { refetch } = authClient.useSession();

  const form = useAppForm({
    defaultValues: {
      name: initialName,
    } as UpdateProfileInput,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: UpdateProfileSchema,
    },
    onSubmit: async ({ value }) => {
      setNotice(null);

      try {
        const response = await fetch(
          '/api/v1/dashboard/settings/profile',
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
              'Profil gagal diperbarui. Silakan coba lagi.',
          });
          return;
        }

        const nextName = value.name.trim();
        form.reset({ name: nextName });
        setNotice({
          kind: 'success',
          message: 'Nama profil berhasil diperbarui.',
        });
        void refetch().catch(() => undefined);
      } catch {
        setNotice({
          kind: 'error',
          message:
            'Profil gagal diperbarui. Periksa koneksi lalu coba lagi.',
        });
      }
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">
          Profil
        </h2>
        <p className="text-muted-foreground text-sm">
          Informasi akun yang digunakan untuk masuk ke
          aplikasi.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Informasi akun</CardTitle>
          <CardDescription>
            Perbarui nama tampilan akun. Alamat email saat
            ini hanya dapat dilihat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid gap-2 border-b pb-5">
            <p className="text-sm font-medium">
              Alamat email
            </p>
            <p className="text-muted-foreground text-sm">
              {email}
            </p>
          </div>

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
                    label="Nama tampilan"
                    description="Nama ini akan ditampilkan di area akun."
                    placeholder="Masukkan nama"
                    autoComplete="name"
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
