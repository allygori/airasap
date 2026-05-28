import Link from 'next/link';
import {
  Store04Icon,
  WhatsappIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { ThemeToggle } from '@/components/theme-toggle';

const navItems = ['Kenapa Kami', 'Harga', 'Testimoni'];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-0 bg-transparent px-5 py-4 sm:px-8 lg:px-10">
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
        <nav className="text-muted-foreground hidden items-center gap-7 text-sm font-bold md:flex">
          {navItems.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(' ', '-')}`}
              className="hover:text-primary transition"
            >
              {item}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a
            href="https://wa.me/6281200000000?text=Halo%20Pasaria%2C%20saya%20mau%20konsultasi%20landing%20page"
            className="bg-primary text-primary-foreground hover:bg-primary-600 hidden items-center gap-2 rounded-full px-5 py-3 text-sm font-black shadow-[0_10px_24px_rgba(0,179,208,0.28)] transition hover:-translate-y-0.5 sm:inline-flex"
          >
            <HugeiconsIcon icon={WhatsappIcon} size={18} />
            Chat WhatsApp
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
