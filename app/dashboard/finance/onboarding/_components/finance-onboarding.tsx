'use client';

import { useState } from 'react';
import {
  ArrowRight02Icon,
  BankIcon,
  Calendar03Icon,
  Chart03Icon,
  InformationCircleIcon,
  Package02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@/components/icons/hugeicons-icon';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import type {
  FinanceOpeningBalanceFinalizeResponseDTO,
  FinanceState,
  FinanceReadinessDTO,
} from '@/modules/finance/client';
import FinanceOpeningBalanceClient from './finance-opening-balance.client';
import { FinanceOnboardingSuccess } from './finance-onboarding-success';

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
  const [completionResult, setCompletionResult] =
    useState<FinanceOpeningBalanceFinalizeResponseDTO | null>(
      null
    );
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);
  const status = data.readiness.status;

  if (completionResult) {
    return (
      <FinanceOnboardingSuccess result={completionResult} />
    );
  }

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

  if (data.finance.status === 'not_started') {
    return (
      <FinanceOnboardingWelcome
        readiness={data.readiness}
        isStarting={isStarting}
        errorMessage={errorMessage}
        onStart={startOnboarding}
      />
    );
  }

  if (data.finance.status === 'active') {
    return <FinanceOnboardingSuccess />;
  }

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
                Setup Finance sudah dimulai. Lengkapi saldo
                awal sebelum masuk ke tahap finalisasi dan
                aktivasi.
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

      {status === 'in_progress' &&
        data.readiness.owner_access && (
          <FinanceOpeningBalanceClient
            enabled
            onFinalized={setCompletionResult}
          />
        )}

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

type FinanceOnboardingWelcomeProps = {
  readiness: FinanceReadinessDTO;
  isStarting: boolean;
  errorMessage: string | null;
  onStart: () => Promise<void>;
};

function FinanceOnboardingWelcome({
  readiness,
  isStarting,
  errorMessage,
  onStart,
}: FinanceOnboardingWelcomeProps) {
  const setupSteps = [
    {
      icon: Calendar03Icon,
      title: 'Tentukan tanggal mulai',
      description:
        'Pilih tanggal yang menggambarkan saldo awal usaha.',
    },
    {
      icon: BankIcon,
      title: 'Masukkan yang relevan',
      description:
        'Siapkan rekening, stok, dan saldo lain yang ingin dicatat.',
    },
    {
      icon: Chart03Icon,
      title: 'Tinjau sebelum aktif',
      description:
        'Periksa rangkuman terlebih dahulu sebelum mengonfirmasi.',
    },
  ];

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:gap-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm font-medium">
            Finance <span aria-hidden="true">/</span> Mulai
          </p>
          <Badge variant="secondary">Fitur opsional</Badge>
        </div>

        <section className="bg-card grid overflow-hidden rounded-3xl border shadow-sm lg:grid-cols-[minmax(0,1.08fr)_minmax(19rem,0.92fr)]">
          <div className="flex min-w-0 flex-col items-start justify-center gap-6 p-6 sm:p-8 lg:p-10 xl:p-12">
            <div className="flex flex-col items-start gap-4">
              <span className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                <span
                  aria-hidden="true"
                  className="bg-primary size-1.5 rounded-full"
                />
                Pencatatan keuangan untuk toko
              </span>
              <h1 className="max-w-2xl text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl">
                Mulai rapikan keuangan usaha Anda.
              </h1>
              <p className="text-muted-foreground max-w-xl text-base leading-7 sm:text-lg">
                Siapkan akun, saldo awal, dan persediaan
                dalam satu alur yang mudah ditinjau. Finance
                bersifat opsional—Orders, Products, dan
                Reports tetap berjalan seperti biasa.
              </p>
            </div>

            <div className="flex w-full flex-col items-start gap-3">
              {readiness.can_start ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={onStart}
                  disabled={isStarting}
                >
                  {isStarting ? (
                    <>
                      <Spinner data-icon="inline-start" />
                      Menyiapkan Finance…
                    </>
                  ) : (
                    <>
                      Mulai setup Finance
                      <span
                        data-icon="inline-end"
                        aria-hidden="true"
                      >
                        <HugeiconsIcon
                          icon={ArrowRight02Icon}
                        />
                      </span>
                    </>
                  )}
                </Button>
              ) : null}
              <p className="text-muted-foreground text-sm leading-6">
                Tidak harus selesai sekaligus. Progres setup
                akan tersimpan sebagai draft untuk
                dilanjutkan nanti.
              </p>
            </div>

            {errorMessage ? (
              <Alert variant="destructive">
                <AlertTitle>
                  Finance belum dapat dimulai
                </AlertTitle>
                <AlertDescription>
                  {errorMessage}
                </AlertDescription>
              </Alert>
            ) : null}

            {readiness.blockers.length > 0 ? (
              <Alert>
                <HugeiconsIcon
                  icon={InformationCircleIcon}
                />
                <AlertTitle>
                  Akses perlu diperiksa
                </AlertTitle>
                <AlertDescription>
                  <ul className="grid gap-1">
                    {readiness.blockers.map((blocker) => (
                      <li key={blocker.code}>
                        {blocker.message}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            ) : null}
          </div>

          <div className="bg-muted/30 flex min-w-0 flex-col justify-center gap-5 border-t p-5 sm:p-8 lg:border-t-0 lg:border-l lg:p-10">
            <div className="flex items-start justify-between gap-4">
              <div className="grid gap-1">
                <p className="text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase">
                  Sebelum mulai mencatat
                </p>
                <h2 className="text-xl font-semibold tracking-tight">
                  Setup singkat, kontrol tetap di tangan
                  Anda.
                </h2>
              </div>
              <StatusBadge status={readiness.status} />
            </div>

            <Card size="sm">
              <CardHeader>
                <CardTitle>Gambaran setup</CardTitle>
                <CardDescription>
                  Finance baru aktif setelah Anda meninjau
                  dan mengonfirmasi.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {setupSteps.map((step, index) => (
                  <div key={step.title}>
                    {index > 0 ? (
                      <Separator className="mb-4" />
                    ) : null}
                    <div className="flex items-start gap-3">
                      <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-xl">
                        <HugeiconsIcon
                          icon={step.icon}
                          size={18}
                        />
                      </span>
                      <div className="grid min-w-0 gap-1">
                        <p className="text-sm font-medium">
                          {step.title}
                        </p>
                        <p className="text-muted-foreground text-sm leading-5">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <WelcomeNote
                icon={Package02Icon}
                title="Isi seperlunya"
                description="Bagian yang tidak relevan bisa dilewati atau bernilai nol."
              />
              <WelcomeNote
                icon={Chart03Icon}
                title="Order lama tetap aman"
                description="Memulai Finance tidak otomatis memposting order lama."
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function WelcomeNote({
  icon,
  title,
  description,
}: {
  icon: typeof Package02Icon;
  title: string;
  description: string;
}) {
  return (
    <Card size="sm">
      <CardHeader className="grid-cols-[auto_1fr] gap-3">
        <span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-lg">
          <HugeiconsIcon icon={icon} size={16} />
        </span>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="col-start-2 text-xs leading-5">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
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
