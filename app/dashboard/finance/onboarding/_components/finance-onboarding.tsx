'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { FinanceState } from '@/modules/finance';
import type { FinanceReadinessDTO } from '@/modules/finance';

type FinanceOnboardingData = {
  finance: Pick<
    FinanceState,
    'status' | 'onboarding_version'
  >;
  readiness: FinanceReadinessDTO;
};

type FinanceOnboardingProps = {
  data: FinanceOnboardingData;
};

export default function FinanceOnboarding({
  data: initialData,
}: FinanceOnboardingProps) {
  const [data, setData] = useState(initialData);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);
  const status = data.readiness.status;

  const startOnboarding = async () => {
    setIsStarting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        '/api/v1/dashboard/finance/onboarding/start',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      const payload: unknown = await response.json();
      const nextData = parseReadinessResponse(payload);

      if (!response.ok || !nextData) {
        setErrorMessage(
          getErrorMessage(payload) ??
            'Finance onboarding gagal dimulai.'
        );
        return;
      }

      setData(nextData);
    } catch {
      setErrorMessage(
        'Finance onboarding gagal dimulai. Coba lagi.'
      );
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
        <div className="max-w-3xl space-y-3">
          <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
            Finance setup / 01
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Siapkan ruang kerja Finance
          </h1>
          <p className="text-muted-foreground max-w-2xl leading-7">
            Finance bersifat opsional. Orders, Products, dan
            Reports tetap berjalan seperti biasa saat setup
            belum dimulai atau belum selesai.
          </p>
        </div>
        <div className="border-border bg-muted/30 rounded-2xl border p-4">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            Versi onboarding
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold">
            v{data.finance.onboarding_version}
          </p>
          <p className="text-muted-foreground mt-2 text-xs leading-5">
            Progress tersimpan di organisasi dan dapat
            dilanjutkan oleh owner.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StepCard
          number="01"
          title="Akses"
          description="Konfirmasi owner organisasi"
          state={
            data.readiness.owner_access ? 'done' : 'current'
          }
        />
        <StepCard
          number="02"
          title="Konfigurasi"
          description="COA dan preferensi akuntansi"
          state={
            status === 'in_progress'
              ? 'current'
              : 'upcoming'
          }
        />
        <StepCard
          number="03"
          title="Aktif"
          description="Mulai gunakan transaksi Finance"
          state={status === 'active' ? 'done' : 'upcoming'}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.55fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Status onboarding</CardTitle>
                <CardDescription className="mt-1">
                  Status dan aksi tersedia ditentukan oleh
                  server.
                </CardDescription>
              </div>
              <StatusBadge status={status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <StatusMessage status={status} />

            {data.readiness.can_start && (
              <Button
                type="button"
                onClick={startOnboarding}
                disabled={isStarting}
              >
                {isStarting
                  ? 'Memulai...'
                  : 'Mulai onboarding'}
              </Button>
            )}

            {data.readiness.can_resume && (
              <div className="border-info/30 bg-info/5 rounded-xl border p-4 text-sm">
                Setup Finance sudah dimulai. Data status
                tersimpan; langkah konfigurasi berikutnya
                akan ditambahkan pada phase onboarding
                berikutnya.
              </div>
            )}

            {errorMessage && (
              <p
                className="text-destructive text-sm"
                role="alert"
              >
                {errorMessage}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yang perlu diketahui</CardTitle>
            <CardDescription>
              Setup Finance tidak mengubah data operasional
              dasar.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-3 text-sm leading-6">
            <p>
              Order lama tidak otomatis diposting menjadi
              jurnal hanya karena onboarding dimulai.
            </p>
            <p>
              Posting Finance baru tersedia setelah modul
              aktif dan mengikuti aturan mapping yang
              disepakati.
            </p>
          </CardContent>
        </Card>
      </div>

      {data.readiness.blockers.length > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardHeader>
            <CardTitle>Perlu perhatian</CardTitle>
            <CardDescription>
              Selesaikan blocker berikut untuk melanjutkan
              onboarding.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-muted-foreground grid gap-2 text-sm">
              {data.readiness.blockers.map((blocker) => (
                <li
                  key={blocker.code}
                  className="flex gap-2"
                >
                  <span
                    className="text-warning"
                    aria-hidden="true"
                  >
                    •
                  </span>
                  <span>{blocker.message}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  state,
}: {
  number: string;
  title: string;
  description: string;
  state: 'done' | 'current' | 'upcoming';
}) {
  const className =
    state === 'done'
      ? 'border-success/40 bg-success/5'
      : state === 'current'
        ? 'border-primary/40 bg-primary/5'
        : 'border-border bg-card';

  return (
    <div className={`rounded-2xl border p-4 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-xs font-semibold">
          {number}
        </span>
        <span className="text-muted-foreground text-[0.65rem] font-bold tracking-[0.18em] uppercase">
          {state === 'done'
            ? 'Selesai'
            : state === 'current'
              ? 'Berjalan'
              : 'Berikutnya'}
        </span>
      </div>
      <p className="mt-5 font-semibold">{title}</p>
      <p className="text-muted-foreground mt-1 text-sm">
        {description}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: FinanceReadinessDTO['status'];
}) {
  const variant =
    status === 'active'
      ? 'success'
      : status === 'blocked'
        ? 'warning'
        : status === 'in_progress'
          ? 'info'
          : 'outline';

  return (
    <Badge variant={variant}>
      {getStatusLabel(status)}
    </Badge>
  );
}

function StatusMessage({
  status,
}: {
  status: FinanceReadinessDTO['status'];
}) {
  const message = {
    not_started:
      'Finance belum dimulai. Memulai onboarding hanya mengubah status Finance menjadi in progress.',
    in_progress:
      'Finance sedang disiapkan. Progress tersimpan dan dapat dilanjutkan tanpa mengulang langkah awal.',
    blocked:
      'Finance belum dapat dilanjutkan sampai blocker dari server diselesaikan.',
    active: 'Finance sudah aktif untuk organisasi ini.',
  }[status];

  return (
    <p className="text-muted-foreground leading-7">
      {message}
    </p>
  );
}

function getStatusLabel(
  status: FinanceReadinessDTO['status']
) {
  return {
    not_started: 'Belum dimulai',
    in_progress: 'Sedang disiapkan',
    blocked: 'Terblokir',
    active: 'Aktif',
  }[status];
}

function parseReadinessResponse(
  payload: unknown
): FinanceOnboardingData | null {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('success' in payload) ||
    payload.success !== true ||
    !('data' in payload) ||
    !payload.data ||
    typeof payload.data !== 'object' ||
    !('finance' in payload.data) ||
    !('readiness' in payload.data)
  ) {
    return null;
  }

  const finance = payload.data.finance;
  const readiness = payload.data.readiness;
  if (
    !finance ||
    typeof finance !== 'object' ||
    !readiness ||
    typeof readiness !== 'object'
  ) {
    return null;
  }

  if (
    !('status' in finance) ||
    !('onboarding_version' in finance) ||
    typeof finance.status !== 'string' ||
    typeof finance.onboarding_version !== 'number' ||
    !('status' in readiness) ||
    !('owner_access' in readiness) ||
    !('can_start' in readiness) ||
    !('can_resume' in readiness) ||
    !('blockers' in readiness) ||
    typeof readiness.status !== 'string' ||
    typeof readiness.owner_access !== 'boolean' ||
    typeof readiness.can_start !== 'boolean' ||
    typeof readiness.can_resume !== 'boolean' ||
    !Array.isArray(readiness.blockers)
  ) {
    return null;
  }

  return {
    finance: {
      status: finance.status as FinanceState['status'],
      onboarding_version: finance.onboarding_version,
    },
    readiness: {
      status:
        readiness.status as FinanceReadinessDTO['status'],
      owner_access: readiness.owner_access,
      can_start: readiness.can_start,
      can_resume: readiness.can_resume,
      blockers: readiness.blockers.filter(
        isReadinessBlocker
      ),
    },
  };
}

function isReadinessBlocker(
  value: unknown
): value is FinanceReadinessDTO['blockers'][number] {
  return (
    Boolean(value) &&
    value !== null &&
    typeof value === 'object' &&
    'code' in value &&
    'message' in value &&
    typeof value.code === 'string' &&
    typeof value.message === 'string'
  );
}

function getErrorMessage(payload: unknown) {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('error' in payload) ||
    !payload.error ||
    typeof payload.error !== 'object' ||
    !('message' in payload.error) ||
    typeof payload.error.message !== 'string'
  ) {
    return null;
  }

  return payload.error.message;
}
