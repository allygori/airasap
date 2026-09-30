'use client';

import { formatMediumDate as formatDate } from '@/lib/date';
import { formatIDR as formatMoney } from '@/lib/number/money';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { revalidateLogic } from '@tanstack/react-form';
import { z } from 'zod';
import { useAppForm } from '@/components/form/form.hook';
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
  FinanceExpenseResponseSchema,
  type FinanceExpenseListResponseDTO,
  type FinanceExpenseSummaryDTO,
} from '@/modules/finance/client';
import {
  createExpenseFormDefaults,
  ExpenseForm,
  type ExpenseAccountOption,
  type ExpenseFormIntent,
  type PaymentAccountOption,
} from './finance-expense.form';
import {
  FinanceExpenseFormSchema,
  type FinanceExpenseFormValues,
} from './finance-expense-form.schema';

const ActionResponseSchema = z.object({
  success: z.literal(true),
  data: FinanceExpenseResponseSchema,
});

const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({ message: z.string() }),
});

type FinanceExpenseClientProps = {
  categoryAccounts: ExpenseAccountOption[];
  paymentAccounts: PaymentAccountOption[];
  expenses: FinanceExpenseListResponseDTO;
};

export function FinanceExpenseClient({
  categoryAccounts,
  paymentAccounts,
  expenses,
}: FinanceExpenseClientProps) {
  const router = useRouter();
  const submitIntentRef = useRef<ExpenseFormIntent>('post');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postingId, setPostingId] = useState<string | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);
  const [successMessage, setSuccessMessage] = useState<
    string | null
  >(null);

  const submit = async (
    values: FinanceExpenseFormValues,
    intent: ExpenseFormIntent
  ) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const createResponse = await fetch(
        '/api/v1/dashboard/finance/expenses-and-outflows',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category_account_id: values.category_account_id,
            amount: Number(values.amount),
            expense_date: `${values.expense_date}T00:00:00.000Z`,
            description: values.description.trim(),
            ...(values.vendor_name.trim()
              ? { vendor_name: values.vendor_name.trim() }
              : {}),
            ...(values.reference.trim()
              ? { reference: values.reference.trim() }
              : {}),
            payment_timing: values.payment_timing,
            ...(values.payment_timing === 'paid'
              ? {
                  payment_account_id:
                    values.payment_account_id,
                }
              : {}),
            ...(values.notes.trim()
              ? { notes: values.notes.trim() }
              : {}),
            ...(values.attachment_reference.trim()
              ? {
                  attachment_reference:
                    values.attachment_reference.trim(),
                }
              : {}),
            idempotency_key: crypto.randomUUID(),
          }),
        }
      );
      const createPayload: unknown =
        await createResponse.json();
      if (!createResponse.ok) {
        setErrorMessage(getErrorMessage(createPayload));
        return;
      }

      const created =
        ActionResponseSchema.safeParse(createPayload);
      if (!created.success) {
        setErrorMessage(
          'Respons server Finance tidak valid.'
        );
        return;
      }

      if (intent === 'post') {
        const postResponse = await fetch(
          `/api/v1/dashboard/finance/expenses-and-outflows/${created.data.data.expense_id}/post`,
          { method: 'POST' }
        );
        const postPayload: unknown =
          await postResponse.json();
        if (!postResponse.ok) {
          setErrorMessage(
            `Draft tersimpan, tetapi posting gagal: ${getErrorMessage(postPayload)}`
          );
          router.refresh();
          return;
        }
        const posted =
          ActionResponseSchema.safeParse(postPayload);
        if (!posted.success) {
          setErrorMessage(
            'Respons posting Finance tidak valid.'
          );
          return;
        }
        setSuccessMessage(
          `Expense posted sebesar ${formatMoney(posted.data.data.amount)}.`
        );
      } else {
        setSuccessMessage(
          'Draft expense berhasil disimpan.'
        );
      }

      form.reset();
      router.refresh();
    } catch {
      setErrorMessage(
        'Tidak dapat menghubungi server Finance.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const form = useAppForm({
    defaultValues: createExpenseFormDefaults({
      categoryAccounts,
      paymentAccounts,
    }),
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: FinanceExpenseFormSchema,
    },
    onSubmit: async ({ value }) => {
      await submit(value, submitIntentRef.current);
    },
  });

  const requestSubmit = (intent: ExpenseFormIntent) => {
    submitIntentRef.current = intent;
    void form.handleSubmit();
  };

  const postExisting = async (
    expense: FinanceExpenseSummaryDTO
  ) => {
    setPostingId(expense.expense_id);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(
        `/api/v1/dashboard/finance/expenses-and-outflows/${expense.expense_id}/post`,
        { method: 'POST' }
      );
      const payload: unknown = await response.json();
      if (!response.ok) {
        setErrorMessage(getErrorMessage(payload));
        return;
      }
      const parsed =
        ActionResponseSchema.safeParse(payload);
      if (!parsed.success) {
        setErrorMessage(
          'Respons posting Finance tidak valid.'
        );
        return;
      }
      setSuccessMessage(
        'Draft expense berhasil diposting.'
      );
      router.refresh();
    } catch {
      setErrorMessage(
        'Tidak dapat menghubungi server Finance.'
      );
    } finally {
      setPostingId(null);
    }
  };

  const hasCategoryAccounts = categoryAccounts.length > 0;
  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="max-w-3xl space-y-2">
        <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
          Finance / Transaksi
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight">
          Expense &amp; outflow
        </h1>
        <p className="text-muted-foreground leading-7">
          Catat biaya operasional dengan kategori dari Chart
          of Accounts. Pilih apakah biaya sudah dibayar atau
          masih menjadi Utang Usaha.
        </p>
      </div>

      {!hasCategoryAccounts ? (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>
              Kategori expense belum siap
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground leading-7">
            Tambahkan minimal satu akun Expense atau Other
            Expense yang aktif dan postable di Chart of
            Accounts sebelum membuat transaksi.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.55fr)]">
          <Card className="max-w-4xl">
            <CardHeader className="border-b">
              <CardTitle>Expense baru</CardTitle>
              <CardDescription>
                Simpan sebagai draft untuk dilengkapi nanti,
                atau simpan &amp; post ketika data sudah
                benar.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ExpenseForm
                form={form}
                categoryAccounts={categoryAccounts}
                paymentAccounts={paymentAccounts}
                isSubmitting={isSubmitting}
                errorMessage={errorMessage}
                successMessage={successMessage}
                onSubmitIntent={requestSubmit}
              />
            </CardContent>
          </Card>

          <Card className="border-l-primary h-fit border-l-4">
            <CardHeader>
              <CardTitle>Aturan expense</CardTitle>
              <CardDescription>
                Satu transaksi expense menghasilkan debit
                biaya dan credit sumber dana atau Utang
                Usaha.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm leading-6">
              <p>Debit kategori Expense/Other Expense.</p>
              <p>Credit Kas/Bank jika sudah dibayar.</p>
              <p>Credit Utang Usaha jika belum dibayar.</p>
              <p className="text-muted-foreground">
                Draft belum membuat journal. Attachment pada
                phase ini hanya berupa referensi teks, bukan
                upload file.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <ExpenseHistory
        expenses={expenses.expenses}
        postingId={postingId}
        onPost={postExisting}
      />
    </div>
  );
}

function ExpenseHistory({
  expenses,
  postingId,
  onPost,
}: {
  expenses: FinanceExpenseSummaryDTO[];
  postingId: string | null;
  onPost: (expense: FinanceExpenseSummaryDTO) => void;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Riwayat expense</CardTitle>
        <CardDescription>
          Draft dapat diposting setelah detail dan akun
          pembayaran siap.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {expenses.length === 0 ? (
          <div className="text-muted-foreground px-6 py-10 text-center text-sm">
            Belum ada expense Finance.
          </div>
        ) : (
          <div className="divide-y">
            {expenses.map((expense) => (
              <div
                key={expense.expense_id}
                className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/finance/expenses-and-outflows/${expense.expense_id}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {expense.description}
                    </Link>
                    <StatusBadge status={expense.status} />
                    <Badge variant="outline">
                      {expense.payment_timing === 'paid'
                        ? 'Dibayar'
                        : 'Utang'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {expense.category_account.code} —{' '}
                    {expense.category_account.name}
                    {' · '}
                    {formatDate(expense.expense_date)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
                  <span className="font-mono text-sm font-semibold">
                    {formatMoney(expense.amount)}
                  </span>
                  {expense.journal_entry_id ? (
                    <Link
                      href={`/dashboard/finance/accounting/general-journal/${expense.journal_entry_id}`}
                      className="text-primary text-xs font-medium underline-offset-4 hover:underline"
                    >
                      Journal
                    </Link>
                  ) : null}
                  {expense.status === 'draft' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        postingId === expense.expense_id
                      }
                      onClick={() => onPost(expense)}
                    >
                      {postingId === expense.expense_id
                        ? 'Mem-posting…'
                        : 'Post draft'}
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({
  status,
}: {
  status: 'draft' | 'posted';
}) {
  return (
    <Badge
      variant={status === 'posted' ? 'success' : 'warning'}
    >
      {status === 'posted' ? 'Posted' : 'Draft'}
    </Badge>
  );
}

function getErrorMessage(payload: unknown) {
  const parsed = ErrorResponseSchema.safeParse(payload);
  return parsed.success
    ? parsed.data.error.message
    : 'Expense Finance gagal diproses.';
}
