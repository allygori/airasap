/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import { withForm } from '@/components/form/form.hook';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CheckmarkCircle01Icon,
  InformationCircleIcon,
} from '@hugeicons/core-free-icons';
import type { FinanceAccountDTO } from '@/modules/finance/client';
import type { FinanceAccountEditFormValues } from './finance-account-edit-form.schema';

type FinanceAccountEditFormProps = {
  account: FinanceAccountDTO;
  open: boolean;
  isSaving: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
};

export const FinanceAccountEditForm = withForm({
  defaultValues: {
    name: '',
    description: '',
  } as FinanceAccountEditFormValues,
  props: {
    account: {} as FinanceAccountDTO,
    open: false,
    isSaving: false,
    error: null,
    onOpenChange: () => undefined,
  } as FinanceAccountEditFormProps,
  render: function Render({
    form,
    account,
    open,
    isSaving,
    error,
    onOpenChange,
  }) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Edit Chart of Accounts
            </DialogTitle>
            <DialogDescription>
              Ubah nama dan deskripsi akun. Kode, struktur,
              tipe, dan aturan posting tidak dapat diubah.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/40 grid min-w-0 gap-3 rounded-xl border p-4 sm:grid-cols-2">
            <ReadOnlyValue
              label="Code"
              value={account.code}
            />
            <ReadOnlyValue
              label="Account type"
              value={formatType(account.type)}
            />
            <ReadOnlyValue
              label="Normal balance"
              value={account.normal_balance}
            />
            <ReadOnlyValue
              label="Posting"
              value={
                account.is_postable
                  ? 'Postable'
                  : 'Group only'
              }
            />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
            className="grid min-w-0 gap-5"
          >
            <FieldGroup className="min-w-0">
              <form.AppField
                name="name"
                children={(field) => (
                  <field.TextField
                    label="Account name"
                    maxLength={120}
                    autoFocus
                    disabled={isSaving}
                    description="Nama akun dapat disesuaikan tanpa mengubah kode akun."
                    className="min-w-0"
                  />
                )}
              />
              <form.AppField
                name="description"
                children={(field) => (
                  <field.TextareaField
                    label="Description"
                    placeholder="Tambahkan konteks penggunaan akun…"
                    maxLength={500}
                    rows={4}
                    disabled={isSaving}
                    description="Opsional, maksimal 500 karakter."
                    className="min-w-0"
                  />
                )}
              />
            </FieldGroup>

            {error ? (
              <Alert variant="destructive">
                <HugeiconsIcon
                  icon={InformationCircleIcon}
                  size={18}
                />
                <AlertTitle>
                  Perubahan belum disimpan
                </AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <DialogFooter>
              <DialogClose
                render={
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving}
                  />
                }
              >
                Batal
              </DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    data-icon="inline-start"
                  />
                )}
                {isSaving
                  ? 'Menyimpan…'
                  : 'Simpan perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  },
});

function ReadOnlyValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground text-xs font-medium">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium">
        {value}
      </p>
    </div>
  );
}

function formatType(value: string) {
  return value
    .split('_')
    .map(
      (part) => part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join(' ');
}
