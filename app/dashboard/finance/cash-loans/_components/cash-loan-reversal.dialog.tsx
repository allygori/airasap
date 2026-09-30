'use client';

import { formatUtcMediumDate as formatDate } from '@/lib/date';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';
import { useAppForm } from '@/components/form/form.hook';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FinanceCashLoanReversalInputSchema,
  FinanceCashLoanResponseSchema,
  type FinanceCashLoanSummaryDTO,
} from '@/modules/finance/client';
import { CashLoanReversalForm } from './cash-loan-reversal.form';
import {
  CashLoanReversalFormSchema,
  type CashLoanReversalFormValues,
} from './cash-loan-reversal.form.schema';

const SuccessResponseSchema = z.object({
  success: z.literal(true),
  data: FinanceCashLoanResponseSchema,
});
const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({ message: z.string() }),
});

export function CashLoanReversalDialog({
  loan,
  businessDate,
  onOpenChange,
}: {
  loan: FinanceCashLoanSummaryDTO;
  businessDate: string;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);
  const form = useAppForm({
    defaultValues: {
      effective_date: businessDate,
      reason: '',
    },
    validators: {
      onSubmit: ({ value }) => {
        const result =
          CashLoanReversalFormSchema.safeParse(value);
        return result.success ? undefined : result.error;
      },
    },
    onSubmit: async ({ value }) => submit(value),
  });

  const submit = async (
    values: CashLoanReversalFormValues
  ) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const payload =
        FinanceCashLoanReversalInputSchema.parse({
          effective_date: `${values.effective_date}T00:00:00.000Z`,
          reason: values.reason.trim(),
        });
      const response = await fetch(
        `/api/v1/dashboard/finance/cash-loans/${loan.loan_id}/reverse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const body: unknown = await response.json();
      if (!response.ok) {
        setErrorMessage(readErrorMessage(body));
        return;
      }
      if (!SuccessResponseSchema.safeParse(body).success) {
        setErrorMessage(
          'Respons server Finance tidak valid.'
        );
        return;
      }
      onOpenChange(false);
      router.refresh();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof z.ZodError
          ? 'Tanggal atau alasan pembalikan tidak valid.'
          : 'Tidak dapat menghubungi server Finance.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Balikkan transaksi Pinjaman Tunai
          </DialogTitle>
          <DialogDescription>
            Finance membuat jurnal pembalik baru. Jurnal
            asli tidak diedit atau dihapus.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-muted/30 rounded-lg border p-3 text-sm">
          <p className="font-medium">{loan.description}</p>
          <p className="text-muted-foreground mt-1">
            {loan.lender.name} · {formatMoney(loan.amount)}{' '}
            · {formatDate(loan.transaction_date)}
          </p>
        </div>
        {errorMessage ? (
          <Alert variant="destructive" role="alert">
            <AlertTitle>Jurnal belum dibalik</AlertTitle>
            <AlertDescription>
              {errorMessage}
            </AlertDescription>
          </Alert>
        ) : null}
        <CashLoanReversalForm
          form={form}
          isSubmitting={isSubmitting}
          onCancel={() => onOpenChange(false)}
          onSubmit={() => void form.handleSubmit()}
        />
      </DialogContent>
    </Dialog>
  );
}

function readErrorMessage(payload: unknown) {
  const parsed = ErrorResponseSchema.safeParse(payload);
  return parsed.success
    ? parsed.data.error.message
    : 'Terjadi kesalahan saat membalik transaksi pinjaman.';
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}
