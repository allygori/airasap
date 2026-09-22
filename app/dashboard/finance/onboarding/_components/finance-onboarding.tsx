'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { FinanceState } from '@/modules/finance';

type FinanceOnboardingProps = {
  finance: Pick<
    FinanceState,
    'status' | 'onboarding_version'
  >;
};

export default function FinanceOnboarding({
  finance: initialFinance,
}: FinanceOnboardingProps) {
  const [finance, setFinance] = useState(initialFinance);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);

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

      if (
        !response.ok ||
        !payload ||
        typeof payload !== 'object' ||
        !('success' in payload) ||
        payload.success !== true ||
        !('data' in payload) ||
        !payload.data ||
        typeof payload.data !== 'object' ||
        !('finance' in payload.data)
      ) {
        setErrorMessage(
          getErrorMessage(payload) ??
            'Finance onboarding gagal dimulai.'
        );
        return;
      }

      const nextFinance = payload.data.finance;
      if (
        !nextFinance ||
        typeof nextFinance !== 'object' ||
        !('status' in nextFinance) ||
        !('onboarding_version' in nextFinance) ||
        typeof nextFinance.status !== 'string' ||
        typeof nextFinance.onboarding_version !== 'number'
      ) {
        setErrorMessage(
          'Response Finance onboarding tidak valid.'
        );
        return;
      }

      setFinance({
        status:
          nextFinance.status as FinanceState['status'],
        onboarding_version: nextFinance.onboarding_version,
      });
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
      <div className="max-w-3xl space-y-2">
        <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
          Finance setup
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight">
          Onboarding Finance
        </h1>
        <p className="text-muted-foreground leading-7">
          Mulai setup Finance untuk organisasi ini. Detail
          Chart of Accounts, opening balance, dan preferensi
          akan ditambahkan pada tahap onboarding berikutnya.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Status onboarding</CardTitle>
          <CardDescription>
            Versi onboarding: {finance.onboarding_version}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Status saat ini:{' '}
            <strong>{finance.status}</strong>
          </p>

          {finance.status === 'not_started' && (
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

          {finance.status === 'in_progress' && (
            <p className="text-muted-foreground">
              Setup Finance sudah dimulai. Tahap pengisian
              konfigurasi akan tersedia berikutnya.
            </p>
          )}

          {finance.status === 'active' && (
            <p className="text-muted-foreground">
              Finance sudah aktif untuk organisasi ini.
            </p>
          )}

          {errorMessage && (
            <p className="text-destructive text-sm">
              {errorMessage}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
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
