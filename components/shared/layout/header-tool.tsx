import Link from 'next/link';
import { Store04Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { ThemeToggle } from '@/components/theme-toggle';

export const HeaderTool = () => {
  return (
    <header className="bg-background sticky top-0 z-50 border-0 px-5 py-4 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link
          href="/"
          className="group flex items-center gap-3"
        >
          <span className="bg-primary text-primary-foreground grid h-10 w-10 place-items-center rounded-full text-sm font-black shadow-[0_18px_45px_rgba(0,179,208,0.22)]">
            <HugeiconsIcon icon={Store04Icon} size={20} />
          </span>
          <span>
            <span className="text-primary block text-sm font-black tracking-[0.28em] uppercase">
              Pasaria
            </span>
            <span className="text-muted-foreground block text-xs font-medium">
              conversion-first commerce
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
