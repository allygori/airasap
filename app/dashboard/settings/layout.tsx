import type { ReactNode } from 'react';
import { Settings2 } from 'lucide-react';

import { SettingsNavigation } from './_components/settings-navigation';

export default function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="@container/main flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-7 p-4 md:p-6 lg:gap-9 lg:p-8">
        <header className="flex items-start gap-4 border-b pb-6">
          <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
            <Settings2
              aria-hidden="true"
              className="size-5"
            />
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-[0.14em] uppercase">
              Workspace
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Settings
            </h1>
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
              Kelola akun, organisasi, toko, keuangan, dan
              tampilan dari satu tempat.
            </p>
          </div>
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-10">
          <SettingsNavigation />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </main>
  );
}
