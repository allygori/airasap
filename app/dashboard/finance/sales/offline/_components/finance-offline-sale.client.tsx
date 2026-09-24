'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { revalidateLogic } from '@tanstack/react-form';
import { z } from 'zod';
import { useAppForm } from '@/components/form/form.hook';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FinanceOfflineSaleInputSchema,
  FinanceOfflineSaleResponseSchema,
  type FinanceOfflineSaleFormOptionsDTO,
  type FinanceOfflineSaleInputDTO,
} from '@/modules/finance/client';
import {
  createOfflineSaleFormDefaults,
  OfflineSaleForm,
} from './offline-sale.form';
import {
  createFinanceOfflineSaleFormSchema,
  type FinanceOfflineSaleFormValues,
} from './finance-offline-sale-form.schema';

const ApiResponseSchema = z.object({
  success: z.literal(true),
  data: FinanceOfflineSaleResponseSchema,
});

const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({ message: z.string() }),
});

type FinanceOfflineSaleClientProps = {
  options: FinanceOfflineSaleFormOptionsDTO;
  initialDate: string;
};

export function FinanceOfflineSaleClient({
  options,
  initialDate,
}: FinanceOfflineSaleClientProps) {
  const router = useRouter();
  const idempotencyKey = useRef<string | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (
    values: FinanceOfflineSaleFormValues
  ) => {
    setError(null);
    setNotice(null);

    const productByKey = new Map(
      options.products.map((product) => [
        product.key,
        product,
      ])
    );
    const lines: FinanceOfflineSaleInputDTO['lines'] = [];
    for (const line of values.lines) {
      const product = productByKey.get(line.product_key);
      if (!product) {
        setError(
          'Pilih produk untuk setiap baris penjualan.'
        );
        return;
      }
      lines.push({
        product_id: product.product_id,
        ...(product.variant_id
          ? { variant_id: product.variant_id }
          : {}),
        quantity: Number(line.quantity),
        unit_price: Number(line.unit_price),
      });
    }

    const requestIdempotencyKey =
      idempotencyKey.current ?? crypto.randomUUID();
    idempotencyKey.current = requestIdempotencyKey;

    setWorking(true);
    try {
      const requestBody =
        FinanceOfflineSaleInputSchema.parse({
          idempotency_key: requestIdempotencyKey,
          transaction_date: values.transaction_date,
          payment_account_id: values.payment_account_id,
          ...(values.reference.trim()
            ? { reference: values.reference.trim() }
            : {}),
          lines,
        });
      const response = await fetch(
        '/api/v1/dashboard/finance/sales/offline',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );
      const payload: unknown = await response.json();

      if (!response.ok) {
        setError(getErrorMessage(payload));
        return;
      }
      const parsed = ApiResponseSchema.safeParse(payload);
      if (!parsed.success) {
        setError('Respons server Finance tidak valid.');
        return;
      }

      const result = parsed.data.data.result;
      if (
        result.status === 'posted' &&
        result.transaction_id
      ) {
        router.push(
          `/dashboard/finance/sales/${result.transaction_id}`
        );
        router.refresh();
        return;
      }

      setNotice(
        result.reason ??
          'Penjualan belum dapat diposting. Periksa detail transaksi Finance.'
      );
      if (result.transaction_id) {
        router.push(
          `/dashboard/finance/sales/${result.transaction_id}`
        );
      }
    } catch (error: unknown) {
      setError(
        error instanceof z.ZodError
          ? 'Data penjualan tidak valid. Periksa kembali detail transaksi.'
          : 'Tidak dapat menghubungi server Finance.'
      );
    } finally {
      setWorking(false);
    }
  };

  const form = useAppForm({
    defaultValues: createOfflineSaleFormDefaults(
      options,
      initialDate
    ),
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic:
        createFinanceOfflineSaleFormSchema(options),
    },
    onSubmit: async ({ value }) => submit(value),
  });

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/dashboard/finance/sales"
            className="text-primary text-sm underline-offset-4 hover:underline"
          >
            ← Kembali ke penjualan
          </Link>
          <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
            Finance / Penjualan
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Penjualan offline
          </h1>
          <p className="text-muted-foreground max-w-2xl leading-7">
            Catat penjualan langsung atau WhatsApp. Finance
            akan mencatat penerimaan, pendapatan, HPP, dan
            pengurangan stok dalam satu alur.
          </p>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Penjualan belum tersimpan</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {notice ? (
        <Alert>
          <AlertTitle>Perlu ditinjau</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}

      {options.products.length === 0 ||
      options.payment_accounts.length === 0 ? (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>
              Belum siap mencatat penjualan
            </CardTitle>
            <CardDescription>
              Siapkan stok Finance yang sudah dimapping,
              catat saldo awal, dan pastikan hanya ada satu
              lokasi inventory aktif. Akun Kas, Bank, atau
              E-wallet juga harus tersedia.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/finance/inventory/setup"
              className={buttonVariants()}
            >
              Siapkan produk dan stok
            </Link>
            <Link
              href="/dashboard/finance/accounting/chart-of-accounts"
              className={buttonVariants({
                variant: 'outline',
              })}
            >
              Periksa akun Kas/Bank
            </Link>
            <Link
              href="/dashboard/finance/onboarding"
              className={buttonVariants({
                variant: 'ghost',
              })}
            >
              Buka saldo awal Finance
            </Link>
          </CardFooter>
        </Card>
      ) : (
        <Card className="min-w-0">
          <CardHeader className="sr-only">
            <CardTitle>Form penjualan offline</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <OfflineSaleForm
              form={form}
              options={options}
              isSubmitting={working}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getErrorMessage(payload: unknown) {
  const parsed = ErrorResponseSchema.safeParse(payload);
  return parsed.success
    ? parsed.data.error.message
    : 'Penjualan offline gagal diproses.';
}
