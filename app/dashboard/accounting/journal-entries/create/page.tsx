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
  MANUAL_JOURNAL_TEMPLATES,
  type ManualJournalTemplateKey,
} from '@/constant/accounting/manual-journal-templates';
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
  const selectedTemplate = template
    ? MANUAL_JOURNAL_TEMPLATES[
        template as ManualJournalTemplateKey
      ]
    : undefined;
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
          '/dashboard/accounting/explorer/journal-entries'
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
      !selectedTemplate ||
      templateDefaultsApplied.current
    ) {
      return;
    }

    const postableAccounts = bootstrap.accounts.filter(
      (account) => account.is_postable
    );

    const findAccount = (match: {
      codes: readonly string[];
      subtypes: readonly string[];
    }) =>
      postableAccounts.find((account) =>
        match.codes.includes(account.code)
      ) ??
      postableAccounts.find((account) =>
        match.subtypes.includes(account.subtype || '')
      );

    form.setFieldValue(
      'lines',
      selectedTemplate.lines.map((line) => ({
        account: findAccount(line.account)?._id ?? '',
        debit: '',
        credit: '',
        description: '',
      }))
    );

    templateDefaultsApplied.current = true;
  }, [bootstrap, form, selectedTemplate]);

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

  const lineDirections = selectedTemplate?.lines.map(
    (line) => line.direction
  );

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div>
          <h2 className="mb-1 text-xl font-semibold">
            {selectedTemplate?.title ||
              'Tambah Manual Journal'}
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
          lineDirections={lineDirections}
          title={selectedTemplate?.title}
          description={selectedTemplate?.description}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}
