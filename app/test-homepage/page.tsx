import type { Metadata } from "next";
import { createElement } from "react";
import type { ReactNode } from "react";
import {
  AlertCircleIcon,
  ChartUpIcon,
  CheckmarkCircle02Icon,
  CrownIcon,
  CursorPointer02Icon,
  HelpCircleIcon,
  Layout03Icon,
  Megaphone02Icon,
  MobileNavigator02Icon,
  MoneyReceiveCircleIcon,
  Package02Icon,
  QuoteUpCircleIcon,
  Rocket02Icon,
  ShoppingCartCheck02Icon,
  Target02Icon,
  WhatsappIcon,
  ShoppingBasket03Icon,
  Store04Icon,
} from "@hugeicons/core-free-icons";
import { ThemeToggle } from "../../components/theme-toggle";

type IconSvgObject = readonly (readonly [
  string,
  Readonly<Record<string, string | number>>,
])[];

function HugeIcon({
  icon,
  className,
  size = 24,
}: {
  icon: IconSvgObject;
  className?: string;
  size?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      {icon.map(([tag, attrs], index) => {
        const iconKey = attrs.key;
        const { key, ...safeAttrs } = attrs;
        void key;

        return createElement(tag, {
          ...safeAttrs,
          key: String(iconKey ?? index),
        });
      })}
    </svg>
  );
}

export const metadata: Metadata = {
  title: "Pasaria.id - Jasa Landing Page Indonesia",
  description:
    "Landing page conversion-first untuk seller marketplace, dropshipper, dan brand yang ingin menaikkan closing dari traffic yang sudah ada.",
};

const navItems = ["Kenapa Kami", "Harga", "Testimoni"];

const trustBadges = ["Dipakai 50+ seller", "Fast delivery 1-2 hari"];

const problems = [
  {
    icon: ChartUpIcon,
    text: "Traffic banyak tapi jarang closing",
  },
  {
    icon: MoneyReceiveCircleIcon,
    text: "Harga kalah saing terus di marketplace",
  },
  {
    icon: CursorPointer02Icon,
    text: "Pembeli cuma lihat-lihat, gak beli",
  },
  {
    icon: HelpCircleIcon,
    text: "Susah jelasin produk secara lengkap",
  },
  {
    icon: Megaphone02Icon,
    text: "Iklan mahal tapi ROI kecil",
  },
];

const solutionHighlights = [
  {
    icon: Target02Icon,
    text: "Struktur copywriting yang terbukti convert",
  },
  {
    icon: Layout03Icon,
    text: "Desain clean & fokus ke pembelian",
  },
  {
    icon: MobileNavigator02Icon,
    text: "Mobile optimized (90% traffic dari HP)",
  },
  {
    icon: Megaphone02Icon,
    text: "Bisa langsung dipakai untuk iklan",
  },
];

const benefits = [
  {
    icon: ShoppingCartCheck02Icon,
    title: "Closing lebih tinggi tanpa nambah traffic",
    body: "Traffic yang sama diarahkan ke halaman yang menjawab ragu buyer sebelum masuk chat.",
  },
  {
    icon: MoneyReceiveCircleIcon,
    title: "Gak perlu perang harga terus",
    body: "Produk dijual dengan konteks, benefit, bukti, dan bonus sehingga value lebih mudah terasa.",
  },
  {
    icon: Rocket02Icon,
    title: "Lebih mudah scale iklan",
    body: "Struktur halaman siap dipakai ulang untuk campaign Meta Ads, TikTok, affiliate, atau broadcast.",
  },
  {
    icon: CrownIcon,
    title: "Brand terlihat lebih profesional",
    body: "Visual, copy, dan CTA dibuat rapi agar buyer merasa sedang membeli dari seller yang serius.",
  },
  {
    icon: Package02Icon,
    title: "Bisa dipakai ulang untuk banyak campaign",
    body: "Satu landing page bisa jadi aset utama untuk promo bulanan, launch produk, dan retargeting.",
  },
];

const steps = [
  {
    icon: Package02Icon,
    title: "Kirim Produk",
    desc: "Kirim link Shopee / Tokopedia kamu",
  },
  {
    icon: Layout03Icon,
    title: "Kami Buatkan",
    desc: "Landing page siap jual dalam 1-2 hari",
  },
  {
    icon: WhatsappIcon,
    title: "Langsung Pakai",
    desc: "Gunakan untuk iklan & closing via WhatsApp",
  },
];

const packages = [
  {
    name: "Basic",
    price: "Rp 300.000",
    features: ["1 Landing Page", "Mobile optimized", "CTA WhatsApp", "Revisi 1x"],
    highlight: false,
  },
  {
    name: "Best Seller",
    price: "Rp 500.000",
    features: [
      "Copywriting optimized",
      "Struktur high-converting",
      "Desain premium",
      "Revisi 2x",
      "Bonus setup CTA",
    ],
    highlight: true,
  },
  {
    name: "Scale",
    price: "Rp 900.000",
    features: [
      "2 variasi landing page",
      "Angle copywriting campaign",
      "Section bonus & urgency",
      "Revisi 3x",
      "Setup tracking event dasar",
      "Prioritas pengerjaan",
    ],
    highlight: false,
  },
];

const testimonials = [
  {
    name: "Andi - Seller Fashion",
    review:
      "Sebelumnya closing susah banget, setelah pakai landing page ini naik hampir 3x.",
  },
  {
    name: "Rina - Dropshipper",
    review: "Lebih enak jualan, gak perlu jelasin panjang di chat.",
  },
];

const faqs = [
  {
    q: "Berapa lama pengerjaan?",
    a: "1-2 hari setelah data lengkap.",
  },
  {
    q: "Apakah bisa revisi?",
    a: "Ya, sesuai paket yang dipilih.",
  },
  {
    q: "Perlu hosting sendiri?",
    a: "Bisa kami bantu setup atau pakai opsi gratis.",
  },
  {
    q: "Cocok untuk produk apa?",
    a: "Semua produk digital & fisik yang butuh peningkatan closing.",
  },
];

function WhatsAppButton({
  children,
  variant = "primary",
}: {
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const classes =
    variant === "primary"
      ? "bg-b-secondary text-[#1f1308] shadow-[0_18px_44px_var(--color-b-secondary)] hover:bg-b-secondary-500"
      : "border border-foreground/15 bg-surface-strong/80 text-foreground hover:border-b-primary/50";

  return (
    <a
      href="https://wa.me/6281200000000?text=Halo%20Pasaria%2C%20saya%20mau%20konsultasi%20landing%20page"
      className={`inline-flex min-h-13 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-black transition duration-300 hover:-translate-y-0.5 sm:text-base ${classes}`}
    >
      <HugeIcon icon={WhatsappIcon} size={20} />
      {children}
    </a>
  );
}

function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
      <div className="absolute -left-6 top-8 h-32 w-32 rounded-full bg-b-secondary/25 blur-3xl" />
      <div className="absolute -right-8 bottom-2 h-44 w-44 rounded-full bg-b-primary/20 blur-3xl" />
      <div className="animate-fade-up relative rotate-[-1.5deg] rounded-[1.65rem] border border-foreground/10 bg-surface-strong/78 p-3 shadow-[0_25px_70px_rgba(10,74,74,0.2)] backdrop-blur-xl dark:shadow-[0_25px_70px_rgba(0,0,0,0.42)]">
        <div className="grid gap-4 rounded-[1.25rem] border border-foreground/10 bg-background p-4 lg:grid-cols-[1.22fr_0.78fr]">
          <div className="relative min-h-[32rem] overflow-hidden rounded-[1.45rem] border border-foreground/10 bg-surface p-2 text-foreground">
            <div className="absolute inset-x-8 top-2 h-28 rounded-full bg-[linear-gradient(180deg,var(--color-b-primary-100),transparent)] blur-2xl opacity-50" />
            <div className="animate-scan absolute left-4 right-4 top-0 h-24 bg-[linear-gradient(180deg,transparent,var(--color-b-primary-200),transparent)] opacity-50" />
            <div className="relative mx-auto h-full max-w-[19rem] rounded-[2rem] border-[10px] border-slate-950 bg-white p-3 text-slate-950 shadow-2xl dark:border-[#061010] dark:bg-background">
              <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-slate-300 dark:bg-foreground/20" />
              <div className="rounded-2xl bg-b-primary p-4 text-white dark:text-[#051010]">
                <div className="flex items-center gap-2 text-[0.62rem] font-black uppercase tracking-[0.22em] opacity-80">
                  <HugeIcon icon={Layout03Icon} size={15} />
                  Product landing
                </div>
                <p className="mt-7 text-3xl font-black leading-none">
                  Serum Glow 30ml
                </p>
                <p className="mt-2 text-xs font-semibold opacity-85">
                  Benefit, review, bonus, CTA WhatsApp.
                </p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[88, 54, 72, 96].map((height) => (
                  <span
                    key={height}
                    className="flex h-16 items-end rounded-2xl bg-b-primary-100 dark:bg-b-primary-900 p-2"
                  >
                    <span
                      className="block w-full rounded-xl bg-b-primary"
                      style={{ height: `${height}%` }}
                    />
                  </span>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                {[100, 78, 56].map((width) => (
                  <span
                    key={width}
                    className="block h-2 rounded-full bg-slate-200 dark:bg-foreground/10"
                    style={{ width: `${width}%` }}
                  />
                ))}
              </div>
              <div className="mt-5 rounded-full bg-b-secondary px-4 py-3 text-center text-xs font-black text-[#1f1308]">
                <span className="inline-flex items-center gap-2">
                  <HugeIcon icon={ShoppingBasket03Icon} size={16} />
                  Order Sekarang
                </span>
              </div>
            </div>
          </div>
          <div className="grid gap-3">
            <div className="rounded-[1.25rem] border border-danger/25 bg-danger/5 p-5 dark:bg-danger/10">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-danger">
                Before
              </p>
              <p className="mt-6 text-4xl font-black text-danger">1.1%</p>
              <p className="mt-2 text-sm font-semibold text-ink-muted">
                klik datang, buyer hilang di etalase kompetitor.
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-b-primary/25 bg-b-primary-50 p-5 dark:bg-b-primary-950">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-b-primary">
                After
              </p>
              <p className="mt-6 text-4xl font-black text-b-primary dark:text-b-primary-300">3.8%</p>
              <p className="mt-2 text-sm font-semibold text-ink-muted">
                satu produk, satu cerita, satu tombol closing.
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-foreground/10 bg-surface p-5">
              <p className="text-sm font-black">Campaign siap jalan</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Meta Ads", "TikTok", "Bio Link", "Affiliate"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-surface-strong px-3 py-2 text-xs font-bold text-ink-muted"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TestHomepage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/86 px-5 py-4 backdrop-blur-xl sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <a href="#" className="group flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-b-primary text-sm font-black text-white shadow-[0_18px_45px_rgba(10,74,74,0.22)] dark:text-[#061010]">
              <HugeIcon icon={Store04Icon} size={20} />
            </span>
            <span>
              <span className="block text-sm font-black uppercase tracking-[0.28em] text-b-primary">
                Pasaria
              </span>
              <span className="block text-xs font-medium text-ink-muted">
                Jasa Landing Page
              </span>
            </span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-bold text-ink-muted md:flex">
            {navItems.map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`} className="transition hover:text-b-primary">
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/6281200000000?text=Halo%20Pasaria%2C%20saya%20mau%20konsultasi%20landing%20page"
              className="hidden items-center gap-2 rounded-full bg-b-secondary px-5 py-3 text-sm font-black text-[#1d120c] shadow-[0_10px_24px_var(--color-b-secondary)] transition hover:-translate-y-0.5 hover:bg-b-secondary-500 sm:inline-flex"
            >
              <HugeIcon icon={WhatsappIcon} size={18} />
              Chat WhatsApp
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="relative isolate px-5 py-8 sm:px-8 lg:px-10">
        {/* Similar gradient background to start-selling */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(255,122,69,0.15),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(10,74,74,0.15),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.62),transparent_38%)] dark:bg-[radial-gradient(circle_at_15%_10%,rgba(255,122,69,0.1),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(10,74,74,0.1),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_38%)]" />
        
        <div className="mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl items-center gap-10 pb-8 pt-6 lg:grid-cols-[1.02fr_0.98fr] lg:pb-10 lg:pt-8">
          <div className="animate-fade-up">
            <div className="mb-5 flex flex-wrap gap-2">
              {trustBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-b-primary/20 bg-b-primary-50 px-4 py-2 text-xs font-black text-b-primary dark:bg-b-primary-950 dark:text-b-primary-300"
                >
                  {badge}
                </span>
              ))}
            </div>
            <h1 className="max-w-4xl text-balance text-4xl font-black leading-[0.92] tracking-normal text-foreground sm:text-6xl lg:text-7xl">
              Jualan Sepi? Naikin Closing 2-5x Pakai Landing Page
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-8 text-ink-muted sm:text-lg">
              Cocok untuk seller Shopee, Tokopedia, dan dropshipper yang capek
              cuma dapat traffic tapi gak closing.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <WhatsAppButton>Konsultasi Gratis via WA</WhatsAppButton>
              <a
                href="#kenapa-kami"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full border border-foreground/15 bg-surface-strong/80 px-7 py-3 text-base font-black text-foreground backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-b-primary/40"
              >
                <HugeIcon icon={HelpCircleIcon} size={21} />
                Lihat masalahnya
              </a>
            </div>
          </div>
          <HeroMockup />
        </div>
      </section>

      <section id="kenapa-kami" className="border-y border-foreground/10 bg-surface py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-10">
          <div>
            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.24em] text-danger">
              <HugeIcon icon={AlertCircleIcon} size={20} />
              Masalah yang sering dialami seller
            </p>
            <h2 className="mt-5 text-4xl font-black leading-tight sm:text-6xl">
              Traffic bocor sebelum buyer paham kenapa harus beli.
            </h2>
            <p className="mt-6 max-w-xl text-base font-semibold leading-8 text-ink-muted">
              Di marketplace, buyer mudah terdistraksi oleh produk lain, voucher
              lain, dan harga yang terus dibandingkan. Landing page menahan
              perhatian mereka pada satu keputusan pembelian.
            </p>
          </div>
          <div className="grid gap-4">
            {problems.map((item, index) => (
              <div
                key={item.text}
                className="grid gap-4 rounded-[1.5rem] border border-foreground/10 bg-surface-strong p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-danger/40 sm:grid-cols-[4rem_1fr]"
              >
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-danger/10 text-xl font-black text-danger">
                  <HugeIcon icon={item.icon} size={28} />
                </span>
                <p className="self-center text-xl font-bold leading-8">
                  <span className="mr-2 text-danger/70">0{index + 1}</span>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-end">
            <div className="max-w-3xl">
              <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.24em] text-b-primary">
                <HugeIcon icon={Target02Icon} size={20} />
                Solusinya
              </p>
              <h2 className="mt-5 text-4xl font-black leading-tight sm:text-6xl">
                Landing Page Khusus Closing
              </h2>
              <p className="mt-6 text-lg leading-8 text-ink-muted">
                Kami buat landing page yang fokus jualan, bukan sekadar tampilan.
                Dirancang khusus untuk meningkatkan conversion dan memaksimalkan
                traffic yang sudah kamu punya.
              </p>
            </div>
            <div className="grid gap-3 rounded-[1.5rem] border border-foreground/10 bg-surface p-4">
              {["Hook", "Problem", "Benefit", "Proof", "Offer", "FAQ", "CTA"].map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-foreground/10 bg-background p-3 transition duration-300 hover:translate-x-1 hover:border-b-secondary/40"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-b-primary text-sm font-black text-white dark:text-[#051010]">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm font-black">{item}</span>
                  <span className={`h-2 rounded-full ${index === 6 ? "w-20 bg-b-secondary" : "w-14 bg-b-primary/35"}`} />
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {benefits.map((item) => (
              <article
                key={item.title}
                className="group rounded-[1.5rem] border border-foreground/10 bg-surface-strong p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-b-primary/35"
              >
                <span className="mb-8 grid h-12 w-12 place-items-center rounded-2xl bg-b-primary-50 text-b-primary transition duration-300 group-hover:rotate-3 group-hover:bg-b-secondary/15 group-hover:text-b-secondary dark:bg-b-primary-950 dark:text-b-primary-300">
                  <HugeIcon icon={item.icon} size={26} />
                </span>
                <h3 className="text-2xl font-black">{item.title}</h3>
                <p className="mt-4 text-base leading-8 text-ink-muted">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="grid overflow-hidden rounded-[2rem] border border-foreground/10 bg-b-primary text-white shadow-[0_35px_90px_rgba(10,74,74,0.25)] dark:text-[#061010] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="p-7 sm:p-10 lg:p-12">
            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.24em] opacity-75">
              <HugeIcon icon={Rocket02Icon} size={20} />
              Cara kerjanya
            </p>
            <h2 className="mt-5 text-4xl font-black leading-tight sm:text-6xl">
              Dari link produk ke halaman siap jual.
            </h2>
            <p className="mt-6 text-lg font-medium leading-8 opacity-80">
              Alurnya dibuat pendek supaya seller bisa cepat validasi halaman,
              mulai promosi, dan melihat respon buyer tanpa proses teknis panjang.
            </p>
          </div>
          <div className="grid gap-px bg-white/15 p-px sm:grid-cols-1">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="bg-b-primary p-7 transition duration-300 hover:bg-white/10 sm:p-8 dark:hover:bg-[#061010]/10 flex items-center gap-6"
              >
                <p className="text-5xl font-black opacity-35">0{index + 1}</p>
                <div>
                   <h3 className="text-xl font-black">{step.title}</h3>
                   <p className="mt-2 text-base font-medium opacity-80">{step.desc}</p>
                </div>
                <span className="ml-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/15 dark:bg-[#061010]/10">
                   <HugeIcon icon={step.icon} size={25} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="harga" className="bg-surface py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="text-center">
            <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.24em] text-b-secondary">
              <HugeIcon icon={CrownIcon} size={20} />
              Paket Harga
            </p>
            <h2 className="mt-4 text-4xl font-black sm:text-6xl">Pilih paket, mulai closing.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-base font-semibold leading-8 text-ink-muted">
              Mulai dari landing page tunggal sampai paket scale untuk campaign
              yang butuh variasi angle, urgency, dan tracking dasar. Slot
              terbatas, pengerjaan cepat (1-2 hari).
            </p>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {packages.map((item) => (
              <article
                key={item.name}
                className={`relative rounded-[1.5rem] border p-8 transition duration-300 hover:-translate-y-1 ${item.highlight
                    ? "border-b-secondary bg-b-secondary text-[#1f1308] shadow-[0_28px_70px_var(--color-b-secondary)]"
                    : "border-foreground/10 bg-surface-strong text-foreground shadow-sm hover:border-b-primary/40"
                  }`}
              >
                {item.highlight ? (
                  <span className="absolute right-6 top-6 rounded-full bg-[#1f1308] px-3 py-1 text-xs font-black text-b-secondary">
                    Favorit
                  </span>
                ) : null}
                <div className="flex items-center gap-3">
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl ${item.highlight ? "bg-black/10" : "bg-b-primary-50 text-b-primary dark:bg-b-primary-950 dark:text-b-primary-300"}`}>
                    <HugeIcon
                      icon={item.name === "Scale" ? Rocket02Icon : item.name === "Basic" ? Layout03Icon : CrownIcon}
                      size={26}
                    />
                  </span>
                  <p className="text-sm font-black uppercase tracking-[0.22em] opacity-75">
                    {item.name}
                  </p>
                </div>
                <p className="mt-6 text-4xl font-black">{item.price}</p>
                <ul className="mt-8 space-y-4">
                  {item.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-base font-bold leading-6">
                      <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-current opacity-70" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-10">
                   <a
                    href="https://wa.me/6281200000000?text=Halo%20Pasaria%2C%20saya%20mau%20ambil%20paket"
                    className={`flex min-h-13 w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-black transition duration-300 sm:text-base ${
                      item.highlight 
                        ? "bg-[#1f1308] text-b-secondary hover:bg-black" 
                        : "bg-b-primary text-white hover:bg-b-primary-700 dark:text-[#061010]"
                    }`}
                  >
                    Ambil paket {item.name}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="testimoni" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.24em] text-b-primary">
              <HugeIcon icon={QuoteUpCircleIcon} size={20} />
              Testimoni
            </p>
            <h2 className="mt-5 text-4xl font-black leading-tight sm:text-6xl">
              Seller lebih mudah menjelaskan value produk.
            </h2>
            <p className="mt-6 text-base font-semibold leading-8 text-ink-muted">
              Halaman yang terstruktur mengurangi chat berulang, memperjelas
              alasan membeli, dan membuat seller lebih percaya diri saat
              mengirim traffic berbayar.
            </p>
          </div>
          <div className="grid gap-4">
            {testimonials.map((item) => (
              <blockquote
                key={item.name}
                className="rounded-[1.5rem] border border-foreground/10 bg-surface-strong p-7 shadow-sm transition hover:-translate-y-1 hover:border-b-secondary/40"
              >
                <HugeIcon className="mb-6 text-b-secondary" icon={QuoteUpCircleIcon} size={36} />
                <p className="text-2xl font-black leading-10">
                  &quot;{item.review}&quot;
                </p>
                <footer className="mt-6 text-sm font-black text-b-primary">
                  {item.name}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
          <div>
            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.24em] text-b-primary">
              <HugeIcon icon={HelpCircleIcon} size={20} />
              FAQ
            </p>
            <h2 className="mt-5 text-4xl font-black leading-tight sm:text-6xl">
              Pertanyaan sebelum mulai.
            </h2>
            <p className="mt-6 text-base font-semibold leading-8 text-ink-muted">
              Kalau produk dan bahan jualanmu sudah siap, prosesnya biasanya
              cepat. Detail teknis seperti CTA, revisi, dan hosting bisa
              dibicarakan saat konsultasi.
            </p>
          </div>
          <div className="grid gap-4">
            {faqs.map((item) => (
              <details
                key={item.q}
                className="group rounded-[1.25rem] border border-foreground/10 bg-background p-6 shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center gap-4 text-xl font-black">
                  <HugeIcon className="shrink-0 text-b-primary" icon={HelpCircleIcon} size={24} />
                  {item.q}
                </summary>
                <p className="mt-4 pl-10 text-base font-semibold leading-8 text-ink-muted">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-10 sm:px-8 lg:px-10 pt-10">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-foreground/10 bg-surface-strong p-7 shadow-[0_28px_80px_rgba(10,74,74,0.14)] sm:p-10 lg:p-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.26em] text-b-secondary">
                <HugeIcon icon={Rocket02Icon} size={20} />
                Mulai Sekarang
              </p>
              <h2 className="mt-5 text-4xl font-black leading-tight sm:text-6xl">
                Jangan buang traffic kamu sia-sia.
              </h2>
              <p className="mt-6 text-lg font-medium leading-8 text-ink-muted">
                Respon cepat. Konsultasi gratis.
              </p>
            </div>
            <div>
               <a
                href="https://wa.me/6281200000000?text=Halo%20Pasaria%2C%20saya%20mau%20konsultasi%20landing%20page"
                className="inline-flex min-h-[3.5rem] items-center justify-center gap-2 rounded-full bg-b-secondary px-8 py-3 text-lg font-black text-[#1d120c] shadow-[0_22px_50px_var(--color-b-secondary)] transition duration-300 hover:-translate-y-1 hover:bg-b-secondary-500"
              >
                <HugeIcon icon={WhatsappIcon} size={22} />
                Chat WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-foreground/10 bg-surface px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
           <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-b-primary text-sm font-black text-white dark:text-[#061010]">
                <HugeIcon icon={Store04Icon} size={20} />
              </span>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.28em] text-b-primary">
                  Pasaria
                </p>
                <p className="text-sm font-medium text-ink-muted">
                  Jasa Landing Page
                </p>
              </div>
            </div>
          <div className="flex gap-6 text-sm font-bold text-ink-muted">
             <a href="https://wa.me/6281200000000?text=Halo%20Pasaria%2C%20saya%20mau%20konsultasi%20landing%20page" className="hover:text-b-secondary">
              WhatsApp
            </a>
            <a href="#" className="hover:text-b-secondary">Privacy Policy</a>
          </div>
        </div>
         <div className="mx-auto mt-10 max-w-7xl border-t border-foreground/10 pt-6 text-sm font-semibold text-ink-muted">
          <p>© 2026 Pasaria.id. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
