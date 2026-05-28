import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { createElement } from 'react';
import {
  AiBrain01Icon,
  AnalyticsUpIcon,
  ChartUpIcon,
  CheckmarkCircle02Icon,
  CursorPointer02Icon,
  DeliveryBox02Icon,
  Link02Icon,
  Megaphone02Icon,
  MoneyReceiveCircleIcon,
  Package02Icon,
  Rocket02Icon,
  ShoppingCartCheck02Icon,
  Store04Icon,
  Target02Icon,
  Upload01Icon,
  UserMultiple02Icon,
  WhatsappIcon,
  WorkflowCircle06Icon,
} from '@hugeicons/core-free-icons';
import Link from 'next/link';
import { Header } from '../../components/shared/layout/header';
import { HugeiconsIcon } from '@hugeicons/react';

export const metadata: Metadata = {
  title: 'Mulai Jualan di Pasaria.id',
  description:
    'Ubah traffic TikTok, Meta Ads, affiliate, dan direct link menjadi transaksi dengan landing page commerce conversion-first.',
};

const proofStats = [
  {
    icon: Target02Icon,
    value: '1 produk',
    label: 'per halaman, tanpa distraksi',
  },
  {
    icon: ShoppingCartCheck02Icon,
    value: '1-2 step',
    label: 'checkout ringkas untuk buyer mobile',
  },
  {
    icon: DeliveryBox02Icon,
    value: 'COD-first',
    label: 'alur siap untuk kebiasaan belanja Indonesia',
  },
];

const painPoints = [
  {
    icon: MoneyReceiveCircleIcon,
    text: 'Tidak perlu perang harga di etalase yang penuh kompetitor.',
  },
  {
    icon: Megaphone02Icon,
    text: 'Traffic dari iklan langsung masuk ke halaman yang fokus menjual.',
  },
  {
    icon: WorkflowCircle06Icon,
    text: 'Kontrol funnel, copy, trust signal, upsell, dan checkout dari satu tempat.',
  },
];

const features = [
  {
    icon: Target02Icon,
    title: 'Landing page produk',
    body: 'Setiap produk punya halaman penjualan sendiri: hero, benefit, bukti sosial, FAQ, bonus, dan CTA checkout yang jelas.',
  },
  {
    icon: Store04Icon,
    title: 'Marketplace tipis',
    body: 'Discovery tetap ada, tapi setelah buyer tertarik, mereka masuk ke conversion mode tanpa produk pesaing di sampingnya.',
  },
  {
    icon: AnalyticsUpIcon,
    title: 'Analytics konversi',
    body: 'Pantau CTR, CR, AOV, dan performa section agar seller tahu bagian mana yang perlu diperbaiki.',
  },
  {
    icon: AiBrain01Icon,
    title: 'Siap A/B testing',
    body: 'Struktur section berbasis JSON membuat eksperimen headline, harga, bonus, dan layout jadi natural untuk fase berikutnya.',
  },
];

const steps = [
  {
    icon: Upload01Icon,
    text: 'Upload produk dan foto terbaik',
  },
  {
    icon: Target02Icon,
    text: 'Pilih struktur halaman yang paling cocok',
  },
  {
    icon: Link02Icon,
    text: 'Bagikan link ke TikTok, Meta Ads, affiliate, atau bio',
  },
  {
    icon: ChartUpIcon,
    text: 'Buyer checkout cepat, seller optimasi dari data',
  },
];

const footerGroups = [
  {
    title: 'Produk',
    links: [
      'Landing Pages',
      'Checkout',
      'Analytics',
      'A/B Testing',
    ],
  },
  {
    title: 'Seller',
    links: [
      'UMKM',
      'Dropshipper',
      'Affiliate',
      'Brand Owner',
    ],
  },
  {
    title: 'Company',
    links: ['Tentang', 'Karier', 'Kontak', 'Status'],
  },
];

function HeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      <div className="bg-primary/25 absolute top-8 -left-6 h-32 w-32 rounded-full blur-3xl" />
      <div className="bg-primary/20 absolute -right-8 bottom-2 h-44 w-44 rounded-full blur-3xl" />
      <div className="animate-fade-up border-border bg-accent/78 relative rotate-[-1.5deg] rounded-[1.65rem] border p-3 shadow-[0_25px_70px_rgba(0,179,208,0.2)] backdrop-blur-xl dark:shadow-[0_25px_70px_rgba(0,0,0,0.42)]">
        <div className="border-border bg-background rounded-[1.25rem] border p-3">
          <div className="grid gap-3 md:grid-cols-[0.72fr_1.28fr]">
            <div className="bg-primary text-primary-foreground rounded-3xl p-4">
              <div className="mb-10 flex justify-between text-[0.65rem] font-bold tracking-[0.22em] uppercase opacity-80">
                <span className="inline-flex items-center gap-2">
                  <HugeiconsIcon
                    icon={ChartUpIcon}
                    size={15}
                  />
                  Live funnel
                </span>
                <span className="inline-flex items-center gap-2">
                  <HugeiconsIcon
                    icon={DeliveryBox02Icon}
                    size={15}
                  />
                  COD
                </span>
              </div>
              <p className="text-4xl leading-none font-black">
                3.8x
              </p>
              <p className="mt-2 text-sm font-semibold opacity-80">
                revenue per visitor
              </p>
              <div className="mt-7 space-y-2">
                {[64, 82, 48].map((width) => (
                  <span
                    key={width}
                    className="animate-pulse-line block h-2 rounded-full bg-white/45 dark:bg-[#061010]/35"
                    style={{ width: `${width}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {proofStats.map((stat, index) => (
                <div
                  key={stat.value}
                  className="border-border bg-muted/50 hover:border-primary/35 rounded-2xl border p-3 transition hover:-translate-y-0.5"
                  style={{
                    animationDelay: `${index * 90}ms`,
                  }}
                >
                  <div className="bg-primary/10 text-primary mb-4 grid h-10 w-10 place-items-center rounded-2xl">
                    <HugeiconsIcon
                      icon={stat.icon}
                      size={22}
                    />
                  </div>
                  <p className="text-primary text-xl font-black">
                    {stat.value}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs font-semibold">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="border-border bg-muted/50 mt-3 rounded-3xl border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-xs font-black tracking-[0.22em] uppercase">
                  <span className="inline-flex items-center gap-2">
                    <HugeiconsIcon
                      icon={Target02Icon}
                      size={15}
                    />
                    Product page
                  </span>
                </p>
                <p className="mt-1 text-xl font-black">
                  Kopi susu gula aren 1L
                </p>
              </div>
              <span className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black shadow-[0_10px_24px_rgba(0,179,208,0.28)]">
                <HugeiconsIcon
                  icon={ShoppingCartCheck02Icon}
                  size={16}
                />
                Checkout
              </span>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {[70, 44, 88, 62, 96].map((height, index) => (
                <div
                  key={height}
                  className="bg-primary/10 flex h-20 items-end rounded-2xl p-2"
                >
                  <div
                    className={`w-full rounded-xl transition-all duration-700 ${
                      index === 4
                        ? 'bg-primary-600'
                        : 'bg-primary'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProblemIllustration() {
  return (
    <div className="border-border bg-muted/30 relative min-h-72 overflow-hidden rounded-[1.75rem] border p-6 shadow-sm">
      <div className="bg-primary/10 absolute top-7 left-7 h-16 w-16 rounded-3xl" />
      <div className="border-primary/30 absolute top-10 right-7 h-24 w-24 rounded-full border" />
      <div className="relative mx-auto mt-8 flex max-w-sm items-end justify-center gap-4">
        {[
          { icon: Megaphone02Icon, label: 'Ad' },
          { icon: CursorPointer02Icon, label: 'Click' },
          { icon: Store04Icon, label: 'Noise' },
        ].map((item, index) => (
          <div
            key={item.label}
            className="animate-float-soft border-border bg-accent/50 w-24 rounded-[1.25rem] border p-4 text-center shadow-sm"
            style={
              {
                animationDelay: `${index * 240}ms`,
                '--float-rotate': `${index === 1 ? 3 : -3}deg`,
              } as CSSProperties
            }
          >
            <span className="bg-primary/10 text-primary mx-auto grid h-10 w-10 place-items-center rounded-full">
              <HugeiconsIcon icon={item.icon} size={22} />
            </span>
            <p className="mt-4 text-sm font-black">
              {item.label}
            </p>
          </div>
        ))}
      </div>
      <div className="bg-foreground/10 relative mx-auto mt-8 h-3 max-w-sm rounded-full">
        <span className="bg-primary absolute top-0 left-0 h-3 w-[32%] rounded-full" />
        <span className="bg-primary/45 absolute top-1 left-[38%] h-1 w-[24%] rounded-full" />
        <span className="bg-primary/45 absolute top-1 right-0 h-1 w-[24%] rounded-full" />
      </div>
    </div>
  );
}

function BuilderIllustration() {
  return (
    <div className="border-border bg-muted/30 grid gap-3 rounded-[1.5rem] border p-4">
      {[
        { icon: Target02Icon, label: 'Hero' },
        { icon: CheckmarkCircle02Icon, label: 'Trust' },
        { icon: Package02Icon, label: 'Offer' },
        {
          icon: ShoppingCartCheck02Icon,
          label: 'Checkout',
        },
      ].map((item, index) => (
        <div
          key={item.label}
          className="border-border bg-background hover:border-primary/40 flex items-center gap-3 rounded-2xl border p-3 transition duration-300 hover:translate-x-1"
        >
          <span className="bg-primary text-primary-foreground grid h-10 w-10 place-items-center rounded-xl text-sm font-black">
            <HugeiconsIcon icon={item.icon} size={21} />
          </span>
          <span className="flex-1 text-sm font-black">
            {item.label}
          </span>
          <span
            className={`h-2 rounded-full ${
              index === 3
                ? 'bg-primary w-20'
                : 'bg-primary/35 w-14'
            }`}
          />
        </div>
      ))}
    </div>
  );
}

function TrafficIllustration() {
  return (
    <div className="bg-primary text-primary-foreground relative min-h-[24rem] overflow-hidden p-8">
      <div className="absolute inset-x-12 top-1/2 h-px bg-white/25 dark:bg-black/25" />
      <div className="absolute top-8 left-8 rounded-full bg-white/15 px-4 py-2 text-xs font-black tracking-[0.22em] uppercase dark:bg-black/10">
        <HugeiconsIcon
          className="mr-2 inline-block align-[-4px]"
          icon={Megaphone02Icon}
          size={16}
        />
        TikTok
      </div>
      <div className="absolute top-16 right-8 rounded-full bg-white/15 px-4 py-2 text-xs font-black tracking-[0.22em] uppercase dark:bg-black/10">
        <HugeiconsIcon
          className="mr-2 inline-block align-[-4px]"
          icon={Target02Icon}
          size={16}
        />
        Meta Ads
      </div>
      <div className="absolute bottom-8 left-10 rounded-full bg-white/15 px-4 py-2 text-xs font-black tracking-[0.22em] uppercase dark:bg-black/10">
        <HugeiconsIcon
          className="mr-2 inline-block align-[-4px]"
          icon={UserMultiple02Icon}
          size={16}
        />
        Affiliate
      </div>
      <div className="absolute right-10 bottom-12 rounded-full bg-white/15 px-4 py-2 text-xs font-black tracking-[0.22em] uppercase dark:bg-black/10">
        <HugeiconsIcon
          className="mr-2 inline-block align-[-4px]"
          icon={Link02Icon}
          size={16}
        />
        Bio Link
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="animate-float-soft bg-primary-600 grid h-36 w-36 place-items-center rounded-full text-center text-sm font-black text-white shadow-[0_24px_60px_rgba(0,179,208,0.35)]">
          PASARIA
          <span className="bg-accent text-foreground absolute -bottom-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs shadow-sm dark:dark:bg-black/60">
            <HugeiconsIcon
              icon={ShoppingCartCheck02Icon}
              size={16}
            />
            Checkout
          </span>
        </div>
      </div>
    </div>
  );
}

export default function StartSellingPage() {
  return (
    <main className="brand-b2 bg-background text-foreground min-h-screen overflow-hidden">
      <Header />
      <section className="relative isolate px-5 py-4 sm:px-8 lg:px-10">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(0,179,208,0.22),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(14,14,17,0.24),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.62),transparent_38%)] dark:bg-[radial-gradient(circle_at_15%_10%,rgba(0,179,208,0.18),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(14,14,17,0.22),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_38%)]" />

        <div className="mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl items-center gap-8 pt-10 pb-8 lg:grid-cols-[1.02fr_0.98fr] lg:pt-8 lg:pb-10">
          <div className="animate-fade-up">
            <div className="border-primary/15 bg-primary/10 text-primary dark:border-primary/25 mb-5 inline-flex items-center gap-3 rounded-full border px-4 py-2 text-xs font-bold shadow-sm sm:text-sm">
              <HugeiconsIcon icon={Store04Icon} size={20} />
              Untuk seller TikTok, Instagram, affiliate, dan
              UMKM
            </div>
            <h1 className="text-foreground max-w-4xl text-4xl leading-[0.92] font-black tracking-normal text-balance sm:text-6xl lg:text-7xl">
              Stop kirim traffic mahal ke halaman yang bikin
              buyer kabur.
            </h1>
            <p className="text-muted-foreground mt-5 max-w-2xl text-base leading-7 text-pretty sm:text-lg">
              Pasaria membantu seller mengubah klik dari
              iklan, konten, dan affiliate menjadi transaksi
              lewat landing page produk yang fokus, checkout
              singkat, dan funnel yang bisa dioptimasi.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="#join"
                className="bg-primary text-primary-foreground hover:bg-primary-600 inline-flex min-h-[3.25rem] items-center justify-center gap-2 rounded-full px-7 py-3 text-base font-black shadow-[0_22px_50px_rgba(0,179,208,0.35)] transition duration-300 hover:-translate-y-1"
              >
                <HugeiconsIcon
                  icon={Rocket02Icon}
                  size={21}
                />
                Mulai jualan lebih fokus
              </a>
              <a
                href="#how"
                className="border-border bg-accent/80 text-foreground hover:border-primary/40 inline-flex min-h-[3.25rem] items-center justify-center gap-2 rounded-full border px-7 py-3 text-base font-black backdrop-blur transition duration-300 hover:-translate-y-1"
              >
                <HugeiconsIcon
                  icon={WorkflowCircle06Icon}
                  size={21}
                />
                Lihat cara kerjanya
              </a>
            </div>
          </div>

          <HeroIllustration />
        </div>
      </section>

      <section className="border-border bg-primary text-primary-foreground border-y py-8">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 sm:px-8 md:grid-cols-3 lg:px-10">
          {proofStats.map((stat) => (
            <div key={stat.value}>
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/15 dark:bg-black/10">
                <HugeiconsIcon icon={stat.icon} size={26} />
              </div>
              <p className="text-4xl font-black">
                {stat.value}
              </p>
              <p className="mt-2 text-sm font-semibold opacity-80">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-10 lg:py-28">
        <div>
          <p className="text-primary flex items-center gap-2 text-sm font-black tracking-[0.26em] uppercase">
            <HugeiconsIcon icon={Store04Icon} size={20} />
            Masalah seller hari ini
          </p>
          <h2 className="mt-5 text-4xl leading-tight font-black sm:text-6xl">
            Traffic ada. Kontrol funnel tidak ada.
          </h2>
          <div className="mt-8 hidden lg:block">
            <ProblemIllustration />
          </div>
        </div>
        <div className="grid gap-4">
          <div className="lg:hidden">
            <ProblemIllustration />
          </div>
          {painPoints.map((item, index) => (
            <div
              key={item.text}
              className="border-border bg-accent hover:border-primary/40 grid gap-4 rounded-[1.5rem] border p-5 shadow-sm transition duration-300 hover:-translate-y-1 sm:grid-cols-[4rem_1fr]"
            >
              <span className="bg-primary/10 text-primary grid h-16 w-16 place-items-center rounded-2xl text-xl font-black">
                <HugeiconsIcon icon={item.icon} size={28} />
              </span>
              <p className="self-center text-xl leading-8 font-bold">
                <span className="text-primary/70 mr-2">
                  0{index + 1}
                </span>
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="how"
        className="bg-surface py-20 lg:py-28"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-primary flex items-center gap-2 text-sm font-black tracking-[0.26em] uppercase">
                <HugeiconsIcon
                  icon={WorkflowCircle06Icon}
                  size={20}
                />
                Cara Pasaria bekerja
              </p>
              <h2 className="mt-5 text-4xl leading-tight font-black sm:text-6xl">
                Marketplace untuk ditemukan, landing page
                untuk closing.
              </h2>
            </div>
            <BuilderIllustration />
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="group border-border bg-background hover:border-primary/35 rounded-[1.5rem] border p-7 shadow-sm transition duration-300 hover:-translate-y-1"
              >
                <span className="bg-primary/10 text-primary group-hover:bg-primary/20 mb-8 grid h-12 w-12 place-items-center rounded-2xl transition duration-300 group-hover:rotate-3">
                  <HugeiconsIcon
                    icon={feature.icon}
                    size={26}
                  />
                </span>
                <h3 className="text-2xl font-black">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground mt-4 text-base leading-8">
                  {feature.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="border-border bg-primary text-primary-foreground grid overflow-hidden rounded-[2rem] border shadow-[0_35px_90px_rgba(0,179,208,0.25)] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="p-7 sm:p-10 lg:p-12">
            <p className="flex items-center gap-2 text-sm font-black tracking-[0.26em] uppercase opacity-75">
              <HugeiconsIcon icon={Link02Icon} size={20} />
              Dari link ke transaksi
            </p>
            <h2 className="mt-5 text-4xl leading-tight font-black sm:text-6xl">
              Dibuat untuk seller yang sudah bisa cari
              traffic.
            </h2>
            <p className="mt-6 text-lg leading-8 font-medium opacity-80">
              Pasaria tidak memaksa seller masuk perang
              etalase. Platform ini memberi halaman yang
              sengaja dibuat untuk satu keputusan: beli
              sekarang.
            </p>
          </div>
          <div className="grid gap-px bg-white/15 p-px sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TrafficIllustration />
            </div>
            {steps.map((step, index) => (
              <div
                key={step.text}
                className="bg-primary p-7 transition duration-300 hover:bg-white/10 sm:p-8 dark:hover:bg-black/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-5xl font-black opacity-35">
                    0{index + 1}
                  </p>
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 dark:bg-black/10">
                    <HugeiconsIcon
                      icon={step.icon}
                      size={25}
                    />
                  </span>
                </div>
                <p className="mt-10 text-xl leading-8 font-black">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="join"
        className="px-5 pb-10 sm:px-8 lg:px-10"
      >
        <div className="border-border bg-accent mx-auto max-w-7xl rounded-[2rem] border p-7 shadow-[0_28px_80px_rgba(0,179,208,0.14)] sm:p-10 lg:p-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <p className="text-primary flex items-center gap-2 text-sm font-black tracking-[0.26em] uppercase">
                <HugeiconsIcon
                  icon={Rocket02Icon}
                  size={20}
                />
                Early seller access
              </p>
              <h2 className="mt-5 max-w-3xl text-4xl leading-tight font-black sm:text-6xl">
                Jadilah seller awal yang ikut membentuk
                Pasaria.
              </h2>
              <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-8">
                Cocok untuk seller yang punya produk jelas,
                traffic dari sosial media, atau sedang
                menjalankan iklan dan ingin halaman closing
                yang lebih fokus.
              </p>
            </div>
            <form className="border-border bg-background rounded-[1.5rem] border p-4">
              <label
                className="text-muted-foreground flex items-center gap-2 text-sm font-black"
                htmlFor="seller-contact"
              >
                <HugeiconsIcon
                  icon={WhatsappIcon}
                  size={18}
                />
                Email atau WhatsApp
              </label>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  id="seller-contact"
                  name="seller-contact"
                  placeholder="nama@brand.id"
                  className="border-border bg-muted text-foreground placeholder:text-muted-foreground/60 focus:border-primary min-h-14 flex-1 rounded-full border px-5 text-base font-semibold transition outline-none"
                />
                <button className="bg-primary text-primary-foreground hover:bg-primary-600 inline-flex min-h-14 items-center justify-center gap-2 rounded-full px-7 font-black transition hover:-translate-y-0.5">
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={20}
                  />
                  Gabung
                </button>
              </div>
              <p className="text-ink-muted mt-4 text-sm leading-6 font-medium">
                MVP baru dibuka bertahap. Tim Pasaria akan
                menghubungi seller yang cocok untuk batch
                pertama.
              </p>
            </form>
          </div>
        </div>
      </section>

      <footer className="border-foreground/10 bg-surface border-t px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="bg-primary grid h-10 w-10 place-items-center rounded-full text-sm font-black text-white dark:text-[#061010]">
                <HugeiconsIcon
                  icon={Store04Icon}
                  size={20}
                />
              </span>
              <div>
                <p className="text-primary text-sm font-black tracking-[0.28em] uppercase">
                  Pasaria
                </p>
                <p className="text-muted-foreground text-sm font-medium">
                  Dummy Commerce Labs, Jakarta Selatan
                </p>
              </div>
            </div>
            <p className="text-muted-foreground mt-6 max-w-lg text-base leading-8">
              Platform conversion-first untuk seller
              Indonesia. Data footer ini masih dummy sampai
              legal, support, dan channel resmi disiapkan.
            </p>
            <div className="text-muted-foreground mt-6 flex flex-wrap gap-3 text-sm font-bold">
              <span className="inline-flex items-center gap-2">
                <HugeiconsIcon
                  icon={Link02Icon}
                  size={17}
                />
                hello@pasaria.id
              </span>
              <span className="inline-flex items-center gap-2">
                <HugeiconsIcon
                  icon={WhatsappIcon}
                  size={17}
                />
                +62 812 0000 0000
              </span>
              <span className="inline-flex items-center gap-2">
                <HugeiconsIcon
                  icon={UserMultiple02Icon}
                  size={17}
                />
                @pasaria.id
              </span>
            </div>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-foreground text-sm font-black tracking-[0.22em] uppercase">
                  <span className="inline-flex items-center gap-2">
                    <HugeiconsIcon
                      icon={
                        group.title === 'Produk'
                          ? Package02Icon
                          : group.title === 'Seller'
                            ? Store04Icon
                            : Link02Icon
                      }
                      size={18}
                    />
                    {group.title}
                  </span>
                </h3>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-ink-muted hover:text-secondary text-sm font-semibold transition"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="border-border text-muted-foreground mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t pt-6 text-sm font-semibold sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Pasaria.id. All rights reserved.</p>
          <p>Terms · Privacy · Seller Policy</p>
        </div>
      </footer>
    </main>
  );
}
