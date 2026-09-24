'use client';

import { useState } from 'react';
import { revalidateLogic } from '@tanstack/react-form';
import { z } from 'zod';
import { useAppForm } from '@/components/form/form.hook';
import {
  FinanceAccountDetailsResponseSchema,
  FinanceAccountUpdateDetailsSchema,
  type FinanceAccountDTO,
  type FinanceAccountDetailsDTO,
} from '@/modules/finance/client';
import { FinanceAccountEditForm } from './finance-account-edit.form';
import {
  FinanceAccountEditFormSchema,
  type FinanceAccountEditFormValues,
} from './finance-account-edit-form.schema';

const FinanceAccountUpdateSuccessSchema = z.object({
  success: z.literal(true),
  data: z.object({
    account: FinanceAccountDetailsResponseSchema,
  }),
});

const FinanceApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

type FinanceAccountEditClientProps = {
  account: FinanceAccountDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (account: FinanceAccountDetailsDTO) => void;
};

export function FinanceAccountEditClient({
  account,
  open,
  onOpenChange,
  onSaved,
}: FinanceAccountEditClientProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (
    values: FinanceAccountEditFormValues
  ) => {
    const input = FinanceAccountUpdateDetailsSchema.parse({
      name: values.name,
      description: values.description.trim() || null,
    });

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/v1/dashboard/finance/accounting/chart-of-accounts/${account.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        }
      );
      const payload: unknown = await response.json();
      const parsed =
        FinanceAccountUpdateSuccessSchema.safeParse(
          payload
        );

      if (!response.ok) {
        const errorPayload =
          FinanceApiErrorSchema.safeParse(payload);
        setError(
          errorPayload.success
            ? errorPayload.data.error.message
            : 'Gagal menyimpan perubahan akun.'
        );
        return;
      }

      if (!parsed.success) {
        setError('Respons server Finance tidak valid.');
        return;
      }

      onOpenChange(false);
      onSaved(parsed.data.data.account);
    } catch {
      setError('Tidak dapat menghubungi server Finance.');
    } finally {
      setIsSaving(false);
    }
  };

  const form = useAppForm({
    defaultValues: {
      name: account.name,
      description: account.description ?? '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: FinanceAccountEditFormSchema,
    },
    onSubmit: async ({ value }) => submit(value),
  });

  return (
    <FinanceAccountEditForm
      form={form}
      account={account}
      open={open}
      isSaving={isSaving}
      error={error}
      onOpenChange={onOpenChange}
    />
  );
}
