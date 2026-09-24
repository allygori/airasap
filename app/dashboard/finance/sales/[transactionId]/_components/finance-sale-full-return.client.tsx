'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { revalidateLogic } from '@tanstack/react-form';
import { z } from 'zod';
import { useAppForm } from '@/components/form/form.hook';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { FinanceSaleFullReturnForm } from './finance-sale-full-return.form';
import {
  FinanceSaleFullReturnFormSchema,
  type FinanceSaleFullReturnFormValues,
} from './finance-sale-full-return-form.schema';

const ApiResponseSchema = z.object({
  success: z.literal(true),
});

const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({ message: z.string() }),
});

type FinanceSaleFullReturnClientProps = {
  journalEntryId: string;
  initialDate: string;
};

export function FinanceSaleFullReturnClient({
  journalEntryId,
  initialDate,
}: FinanceSaleFullReturnClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (
    values: FinanceSaleFullReturnFormValues
  ) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/v1/dashboard/finance/accounting/journal-entries/${journalEntryId}/reverse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            effective_date: values.effective_date,
            description: `Retur penuh: ${values.description.trim()}`,
            idempotency_key: `finance-sale-full-return:${journalEntryId}`,
          }),
        }
      );
      const payload: unknown = await response.json();

      if (!response.ok) {
        setError(getErrorMessage(payload));
        return;
      }
      if (!ApiResponseSchema.safeParse(payload).success) {
        setError('Respons server Finance tidak valid.');
        return;
      }

      setOpen(false);
      form.reset();
      router.refresh();
    } catch {
      setError('Tidak dapat menghubungi server Finance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const form = useAppForm({
    defaultValues: {
      effective_date: initialDate,
      description: '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: FinanceSaleFullReturnFormSchema,
    },
    onSubmit: async ({ value }) => submit(value),
  });

  return (
    <div className="grid gap-3">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Retur belum diproses</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <FinanceSaleFullReturnForm
        form={form}
        open={open}
        isSubmitting={isSubmitting}
        onOpenChange={setOpen}
      />
    </div>
  );
}

function getErrorMessage(payload: unknown) {
  const parsed = ErrorResponseSchema.safeParse(payload);
  return parsed.success
    ? parsed.data.error.message
    : 'Finance tidak dapat memproses retur ini.';
}
