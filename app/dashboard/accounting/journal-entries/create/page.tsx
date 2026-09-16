'use client';

import { useEffect, useRef, useState } from 'react';
import {
  useRouter,
  useSearchParams,
} from 'next/navigation';
import { toast } from 'sonner';
import { revalidateLogic } from '@tanstack/react-form';
import { z } from 'zod';
import { useAppForm } from '@/components/form/form.hook';
import {
  ManualJournalForm,
  ManualJournalFormSchema,
} from '../../_components/manual-journal.form';

type AccountOption = {
  _id: string;
  code: string;
  name: string;
  type: string;
  subtype?: string;
  is_postable: boolean;
};

type BootstrapData = {
  accounts: AccountOption[];
  scopeOptions: {
    stores: Array<{
      id: string;
      name: string;
      code: string | null;
    }>;
    platforms: string[];
  };
};

type ApiPayload<T> = {
  success: boolean;
  data?: T;
  error?: { message?: string };
};

const defaultValues: z.input<
  typeof ManualJournalFormSchema
> = {
  transaction_date: new Date().toISOString().slice(0, 10),
  description: '',
  store_id: '',
  lines: [
    { account: '', debit: '', credit: '', description: '' },
    { account: '', debit: '', credit: '', description: '' },
  ],
};

export default function CreateManualJournalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const template = searchParams.get('template');
  const [bootstrap, setBootstrap] =
    useState<BootstrapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(
    null
  );
  const templateDefaultsApplied = useRef(false);

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
              'Gagal memuat data accounting.'
          );
        }
        setBootstrap(payload.data);
      } catch (error) {
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Gagal memuat data accounting.'
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
    validators: { onDynamic: ManualJournalFormSchema },
    onSubmit: async ({ value }) => {
      try {
        const response = await fetch(
          '/api/v1/dashboard/accounting/journal-entries/manual',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transaction_date: value.transaction_date,
              description: value.description,
              store_id: value.store_id || undefined,
              lines: value.lines.map((line) => ({
                account: line.account,
                debit: Number(line.debit || 0),
                credit: Number(line.credit || 0),
                description: line.description || undefined,
              })),
            }),
          }
        );
        const payload =
          (await response.json()) as ApiPayload<unknown>;
        if (!response.ok || !payload.success) {
          throw new Error(
            payload.error?.message ||
              'Gagal memposting manual journal.'
          );
        }
        toast.success('Manual journal berhasil diposting.');
        router.push(
          '/dashboard/accounting/journal-entries'
        );
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Gagal memposting manual journal.'
        );
      }
    },
  });

  useEffect(() => {
    if (
      !bootstrap ||
      !template ||
      templateDefaultsApplied.current
    ) {
      return;
    }

    const postableAccounts = bootstrap.accounts.filter(
      (account) => account.is_postable
    );
    const cashAccount = postableAccounts.find(
      (account) =>
        ['1110', '1120', '1130', '1140'].includes(
          account.code
        ) ||
        [
          'cash',
          'bank',
          'marketplace_balance',
          'e_wallet',
        ].includes(account.subtype || '')
    );

    if (template === 'capital-contribution') {
      const capitalAccount = postableAccounts.find(
        (account) =>
          account.subtype === 'owner_capital' ||
          ['3110', '3120'].includes(account.code)
      );
      if (cashAccount && capitalAccount) {
        form.setFieldValue('lines', [
          {
            account: cashAccount._id,
            debit: '',
            credit: '',
            description: '',
          },
          {
            account: capitalAccount._id,
            debit: '',
            credit: '',
            description: '',
          },
        ]);
      }
    }

    if (template === 'owner-distribution') {
      const drawingsAccount = postableAccounts.find(
        (account) =>
          account.subtype === 'owner_drawings' ||
          ['3310', '3320'].includes(account.code)
      );
      if (cashAccount && drawingsAccount) {
        form.setFieldValue('lines', [
          {
            account: drawingsAccount._id,
            debit: '',
            credit: '',
            description: '',
          },
          {
            account: cashAccount._id,
            debit: '',
            credit: '',
            description: '',
          },
        ]);
      }
    }

    templateDefaultsApplied.current = true;
  }, [bootstrap, form, template]);

  if (loading) {
    return (
      <div className="p-6 text-sm">
        Memuat accounting workspace…
      </div>
    );
  }

  if (loadError || !bootstrap) {
    return (
      <div className="text-destructive p-6 text-sm">
        {loadError || 'Data accounting tidak tersedia.'}
      </div>
    );
  }

  const templateCopy: Record<
    string,
    { title: string; description: string }
  > = {
    'capital-contribution': {
      title: 'Catat Setoran Modal',
      description:
        'Gunakan debit pada kas/bank yang menerima dana dan credit pada subakun modal pemilik yang sesuai.',
    },
    'owner-distribution': {
      title: 'Catat Penarikan Pemilik',
      description:
        'Gunakan debit pada subakun prive/distribusi pemilik dan credit pada kas/bank yang digunakan.',
    },
  };
  const copy = template
    ? templateCopy[template]
    : undefined;

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div>
          <h2 className="mb-1 text-xl font-semibold">
            {copy?.title || 'Tambah Manual Journal'}
          </h2>
          <p className="text-muted-foreground text-sm">
            Input manual melalui journal posting service
            agar ledger dan laporan tetap berasal dari
            sumber yang sama.
          </p>
        </div>
        <ManualJournalForm
          form={form}
          accounts={bootstrap.accounts.filter(
            (account) => account.is_postable
          )}
          stores={bootstrap.scopeOptions?.stores ?? []}
          title={copy?.title}
          description={copy?.description}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}
