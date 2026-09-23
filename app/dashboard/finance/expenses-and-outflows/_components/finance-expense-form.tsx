'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';
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

type ExpenseAccountOption = {
  id: string;
  code: string;
  name: string;
  type: 'expense' | 'other_expense';
};

type PaymentAccountOption = {
  id: string;
  code: string;
  name: string;
  subtype: string | null;
};

const ActionResponseSchema = z.object({
  success: z.literal(true),
  data: FinanceExpenseResponseSchema,
});

const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({ message: z.string() }),
});

export function FinanceExpenseForm({
  categoryAccounts,
  paymentAccounts,
  expenses,
}: {
  categoryAccounts: ExpenseAccountOption[];
  paymentAccounts: PaymentAccountOption[];
  expenses: FinanceExpenseListResponseDTO;
}) {
  const router = useRouter();
  const [categoryAccountId, setCategoryAccountId] =
    useState(categoryAccounts[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [reference, setReference] = useState('');
  const [paymentTiming, setPaymentTiming] = useState<
    'paid' | 'payable'
  >('paid');
  const [paymentAccountId, setPaymentAccountId] = useState(
    paymentAccounts[0]?.id ?? ''
  );
  const [notes, setNotes] = useState('');
  const [attachmentReference, setAttachmentReference] =
    useState('');
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

  const submit = async (shouldPost: boolean) => {
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
            category_account_id: categoryAccountId,
            amount: Number(amount),
            expense_date: `${expenseDate}T00:00:00.000Z`,
            description: description.trim(),
            ...(vendorName.trim()
              ? { vendor_name: vendorName.trim() }
              : {}),
            ...(reference.trim()
              ? { reference: reference.trim() }
              : {}),
            payment_timing: paymentTiming,
            ...(paymentTiming === 'paid'
              ? { payment_account_id: paymentAccountId }
              : {}),
            ...(notes.trim()
              ? { notes: notes.trim() }
              : {}),
            ...(attachmentReference.trim()
              ? {
                  attachment_reference:
                    attachmentReference.trim(),
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

      if (shouldPost) {
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

      resetForm();
      router.refresh();
    } catch {
      setErrorMessage(
        'Tidak dapat menghubungi server Finance.'
      );
    } finally {
      setIsSubmitting(false);
    }
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

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setVendorName('');
    setReference('');
    setNotes('');
    setAttachmentReference('');
    setPaymentTiming('paid');
  };

  const hasCategoryAccounts = categoryAccounts.length > 0;
  const hasPaymentAccounts = paymentAccounts.length > 0;

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
              <form
                className="grid gap-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submit(true);
                }}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">
                    Kategori expense
                    <select
                      value={categoryAccountId}
                      onChange={(event) =>
                        setCategoryAccountId(
                          event.target.value
                        )
                      }
                      className={InputClass}
                      required
                    >
                      {categoryAccounts.map((account) => (
                        <option
                          key={account.id}
                          value={account.id}
                        >
                          {account.code} — {account.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Nominal (IDR)
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={amount}
                      onChange={(event) =>
                        setAmount(event.target.value)
                      }
                      placeholder="150000"
                      className={InputClass}
                      required
                    />
                  </label>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">
                    Tanggal transaksi
                    <input
                      type="date"
                      value={expenseDate}
                      onChange={(event) =>
                        setExpenseDate(event.target.value)
                      }
                      className={InputClass}
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Cara pembayaran
                    <select
                      value={paymentTiming}
                      onChange={(event) =>
                        setPaymentTiming(
                          event.target.value as
                            | 'paid'
                            | 'payable'
                        )
                      }
                      className={InputClass}
                    >
                      <option value="paid">
                        Sudah dibayar
                      </option>
                      <option value="payable">
                        Jadi Utang Usaha
                      </option>
                    </select>
                  </label>
                </div>

                {paymentTiming === 'paid' ? (
                  <label className="grid gap-2 text-sm font-medium">
                    Dibayar dari
                    <select
                      value={paymentAccountId}
                      onChange={(event) =>
                        setPaymentAccountId(
                          event.target.value
                        )
                      }
                      className={InputClass}
                      required
                      disabled={!hasPaymentAccounts}
                    >
                      {paymentAccounts.map((account) => (
                        <option
                          key={account.id}
                          value={account.id}
                        >
                          {account.code} — {account.name}
                        </option>
                      ))}
                    </select>
                    {!hasPaymentAccounts ? (
                      <span className="text-destructive text-xs">
                        Belum ada akun Kas, Bank, E-wallet,
                        atau Saldo Marketplace yang aktif
                        dan postable.
                      </span>
                    ) : null}
                  </label>
                ) : (
                  <div className="border-info/30 bg-info/5 text-info-foreground rounded-lg border px-4 py-3 text-sm leading-6">
                    Expense akan dicatat ke Utang Usaha
                    2100. Pembayaran utang dilakukan melalui
                    transaksi settlement pada phase
                    berikutnya.
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">
                    Deskripsi
                    <input
                      value={description}
                      onChange={(event) =>
                        setDescription(event.target.value)
                      }
                      maxLength={500}
                      placeholder="Contoh: Internet toko bulan September"
                      className={InputClass}
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Vendor / penerima (opsional)
                    <input
                      value={vendorName}
                      onChange={(event) =>
                        setVendorName(event.target.value)
                      }
                      maxLength={160}
                      placeholder="Contoh: Penyedia internet"
                      className={InputClass}
                    />
                  </label>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">
                    No. invoice / referensi
                    <input
                      value={reference}
                      onChange={(event) =>
                        setReference(event.target.value)
                      }
                      maxLength={120}
                      placeholder="Contoh: INV-2026-009"
                      className={InputClass}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Referensi lampiran (opsional)
                    <input
                      value={attachmentReference}
                      onChange={(event) =>
                        setAttachmentReference(
                          event.target.value
                        )
                      }
                      maxLength={200}
                      placeholder="Contoh: drive://invoice-009"
                      className={InputClass}
                    />
                  </label>
                </div>

                <label className="grid gap-2 text-sm font-medium">
                  Catatan (opsional)
                  <textarea
                    value={notes}
                    onChange={(event) =>
                      setNotes(event.target.value)
                    }
                    maxLength={500}
                    rows={3}
                    placeholder="Catatan tambahan untuk transaksi ini"
                    className={`${InputClass} h-auto py-2`}
                  />
                </label>

                {errorMessage ? (
                  <div
                    role="alert"
                    className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm"
                  >
                    {errorMessage}
                  </div>
                ) : null}
                {successMessage ? (
                  <div
                    role="status"
                    className="border-success/30 bg-success/10 text-success rounded-lg border px-4 py-3 text-sm"
                  >
                    {successMessage}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      isSubmitting ||
                      (paymentTiming === 'paid' &&
                        !hasPaymentAccounts)
                    }
                    onClick={() => void submit(false)}
                  >
                    Simpan draft
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      (paymentTiming === 'paid' &&
                        !hasPaymentAccounts)
                    }
                  >
                    {isSubmitting
                      ? 'Memproses…'
                      : 'Simpan & post'}
                  </Button>
                  <Badge variant="outline">
                    Journal selalu seimbang
                  </Badge>
                </div>
              </form>
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

const InputClass =
  'border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-10 rounded-lg border px-3 text-sm outline-none focus-visible:ring-3';

const formatMoney = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
  }).format(new Date(value));

function getErrorMessage(payload: unknown) {
  const parsed = ErrorResponseSchema.safeParse(payload);
  return parsed.success
    ? parsed.data.error.message
    : 'Expense Finance gagal diproses.';
}
