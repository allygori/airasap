import Link from "next/link";
import { Store04Icon, WhatsappIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = ["Kenapa Kami", "Harga", "Testimoni"];

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-transparent border-0 px-5 py-4 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-black text-primary-foreground shadow-[0_18px_45px_rgba(0,179,208,0.22)]">
            <HugeiconsIcon icon={Store04Icon} size={20} />
          </span>
          <span>
            <span className="block text-sm font-black uppercase tracking-[0.28em] text-primary">
              Pasaria
            </span>
            <span className="block text-xs font-medium text-muted-foreground">
              conversion-first commerce
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-bold text-muted-foreground md:flex">
          {navItems.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(" ", "-")}`}
              className="transition hover:text-primary"
            >
              {item}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a
            href="https://wa.me/6281200000000?text=Halo%20Pasaria%2C%20saya%20mau%20konsultasi%20landing%20page"
            className="hidden items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-black text-primary-foreground shadow-[0_10px_24px_rgba(0,179,208,0.28)] transition hover:-translate-y-0.5 hover:bg-primary-600 sm:inline-flex"
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
