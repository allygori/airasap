'use client';

import { useSyncExternalStore } from 'react';
import { useTheme } from '@wrksz/themes/client';

import { ThemeSelector } from '@/components/dashboard/theme-selector';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const APPEARANCE_MODES = [
  { label: 'Ikuti sistem', value: 'system' },
  { label: 'Terang', value: 'light' },
  { label: 'Gelap', value: 'dark' },
] as const;

type AppearanceMode =
  (typeof APPEARANCE_MODES)[number]['value'];

function subscribeToMountState() {
  return () => undefined;
}

function getClientMountSnapshot() {
  return true;
}

function getServerMountSnapshot() {
  return false;
}

function isAppearanceMode(
  value: unknown
): value is AppearanceMode {
  return APPEARANCE_MODES.some(
    (mode) => mode.value === value
  );
}

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const isMounted = useSyncExternalStore(
    subscribeToMountState,
    getClientMountSnapshot,
    getServerMountSnapshot
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">
          Tampilan
        </h2>
        <p className="text-muted-foreground text-sm">
          Sesuaikan mode warna dan gaya antarmuka untuk
          browser ini.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Mode warna</CardTitle>
          <CardDescription>
            Pilih mode terang, gelap, atau ikuti pengaturan
            perangkat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="appearance-mode">
                Mode
              </FieldLabel>
              {isMounted ? (
                <Select
                  value={
                    isAppearanceMode(theme)
                      ? theme
                      : 'system'
                  }
                  onValueChange={(value) => {
                    if (isAppearanceMode(value)) {
                      setTheme(value);
                    }
                  }}
                >
                  <SelectTrigger
                    id="appearance-mode"
                    className="w-full max-w-sm"
                  >
                    <SelectValue placeholder="Pilih mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {APPEARANCE_MODES.map((mode) => (
                      <SelectItem
                        key={mode.value}
                        value={mode.value}
                      >
                        {mode.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Skeleton className="h-8 w-full max-w-sm" />
              )}
              <FieldDescription>
                Pilihan ini tersimpan di penyimpanan lokal
                browser.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tema dan gaya</CardTitle>
          <CardDescription>
            Pilih warna utama atau gaya tampilan. Perubahan
            langsung diterapkan dan tersimpan di browser
            ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSelector />
        </CardContent>
      </Card>
    </div>
  );
}
