'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { revalidateLogic } from '@tanstack/react-form';
import { z } from 'zod';
import { useAppForm } from '@/components/form/form.hook';
import {
  AccountingCutoverForm,
  AccountingCutoverFormSchema,
} from '../_components/accounting-cutover.form';

type AccountOption = {
  _id: string;
  code: string;
  name: string;
  type: string;
  is_postable: boolean;
};

type BootstrapData = {
  accounts: AccountOption[];
};

type ApiPayload<T> = {
  success: boolean;
  data?: T;
  error?: { code?: string; message?: string };
};

const defaultValues: z.input<
  typeof AccountingCutoverFormSchema
> = {
  effective_date: new Date().toISOString().slice(0, 10),
  description: '',
  lines: [
    { account: '', debit: '', credit: '', description: '' },
    { account: '', debit: '', credit: '', description: '' },
  ],
};

export default function AccountingOnboardingPage() {
  const router = useRouter();
  const [bootstrap, setBootstrap] =
    useState<BootstrapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(
    null
  );

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(
          '/api/v1/dashboard/accounting/bootstrap',
          {
            cache: 'no-store',
          }
        );
        const payload =
          (await response.json()) as ApiPayload<BootstrapData>;
        if (
          !response.ok ||
          !payload.success ||
          !payload.data
        ) {
          throw new Error(
            payload.error?.message ||
              'Gagal memuat Chart of Accounts.'
          );
        }
        setBootstrap(payload.data);
      } catch (error) {
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Gagal memuat Chart of Accounts.'
        );
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: AccountingCutoverFormSchema },
    onSubmit: async ({ value }) => {
      try {
        const response = await fetch(
          '/api/v1/dashboard/accounting/cutover',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              effective_date: value.effective_date,
              description: value.description,
              lines: value.lines.map((line) => ({
                account: line.account,
                debit: Number(line.debit || 0),
                credit: Number(line.credit || 0),
              })),
            }),
          }
        );
        const payload =
          (await response.json()) as ApiPayload<unknown>;
        if (!response.ok || !payload.success) {
          throw new Error(
            payload.error?.message ||
              'Gagal menyimpan opening balance.'
          );
        }
        toast.success(
          'Accounting cutover berhasil disiapkan.'
        );
        router.push(
          '/dashboard/accounting/journal-entries'
        );
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Gagal menyimpan opening balance.'
        );
      }
    },
  });

  if (loading) {
    return (
      <div className="p-6 text-sm">
        Memuat accounting onboarding…
      </div>
    );
  }

  if (loadError || !bootstrap) {
    return (
      <div className="text-destructive p-6 text-sm">
        {loadError || 'Chart of Accounts tidak tersedia.'}
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div>
          <h2 className="mb-1 text-xl font-semibold">
            Accounting onboarding
          </h2>
          <p className="text-muted-foreground max-w-3xl text-sm">
            Onboarding ini hanya menginisialisasi pembukuan
            organization aktif. Tidak membuat organization,
            store, atau user baru.
          </p>
        </div>
        <AccountingCutoverForm
          form={form}
          accounts={bootstrap.accounts.filter(
            (account) => account.is_postable
          )}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}
