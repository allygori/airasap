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
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Header } from "../components/shared/layout/header";


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
      ? "bg-primary text-primary-foreground shadow-[0_18px_44px_rgba(0,179,208,0.28)] hover:bg-primary-600"
      : "border border-foreground/15 bg-accent/80 text-foreground hover:border-primary/50";

  return (
    <a
      href="https://wa.me/6281200000000?text=Halo%20Pasaria%2C%20saya%20mau%20konsultasi%20landing%20page"
      className={`inline-flex min-h-13 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-black transition duration-300 hover:-translate-y-0.5 sm:text-base ${classes}`}
    >
      <HugeiconsIcon icon={WhatsappIcon} size={20} />
      {children}
    </a>
  );
}

function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="grid gap-4 rounded-[1.75rem] border border-foreground/10 bg-accent p-4 shadow-[0_28px_80px_rgba(15,23,42,0.12)] dark:shadow-[0_28px_80px_rgba(0,0,0,0.35)] lg:grid-cols-[1.22fr_0.78fr]">
        <div className="relative min-h-[32rem] overflow-hidden rounded-[1.45rem] border border-foreground/10 bg-transparent p-2 text-foreground">
          <div className="absolute inset-x-8 top-2 h-28 rounded-full bg-[linear-gradient(180deg,rgba(0,179,208,0.18),transparent)] blur-2xl" />
          <div className="animate-scan absolute left-4 right-4 top-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(0,179,208,0.12),transparent)]" />
          <div className="relative mx-auto h-full max-w-[19rem] rounded-[2rem] border-[10px] border-slate-950 bg-white p-3 text-slate-950 shadow-2xl dark:border-black dark:bg-[#f8fafc]">
            <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-slate-300" />
            <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
              <div className="flex items-center gap-2 text-[0.62rem] font-black uppercase tracking-[0.22em] opacity-80">
                <HugeiconsIcon icon={Layout03Icon} size={15} />
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
                  className="flex h-16 items-end rounded-2xl bg-primary-100 dark:bg-primary/20 p-2"
                >
                  <span
                    className="block w-full rounded-xl bg-primary"
                    style={{ height: `${height}%` }}
                  />
                </span>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {[100, 78, 56].map((width) => (
                <span
                  key={width}
                  className="block h-2 rounded-full bg-slate-200"
                  style={{ width: `${width}%` }}
                />
              ))}
            </div>
            <div className="mt-5 rounded-full bg-primary px-4 py-3 text-center text-xs font-black text-primary-foreground">
              <span className="inline-flex items-center gap-2">
                <HugeiconsIcon icon={ShoppingBasket03Icon} size={16} />
                Order Sekarang
              </span>
            </div>
          </div>
        </div>
        <div className="grid gap-3">
          <div className="rounded-[1.25rem] border border-destructive/25 bg-destructive/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-destructive">
              Before
            </p>
            <p className="mt-6 text-4xl font-black text-destructive">1.1%</p>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              klik datang, buyer hilang di etalase kompetitor.
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-primary/25 bg-primary-100 dark:bg-primary/20 p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
              After
            </p>
            <p className="mt-6 text-4xl font-black text-primary">3.8%</p>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              satu produk, satu cerita, satu tombol closing.
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-foreground/10 bg-surface p-5">
            <p className="text-sm font-black">Campaign siap jalan</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Meta Ads", "TikTok", "Bio Link", "Affiliate"].map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-accent px-3 py-2 text-xs font-bold text-muted-foreground"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <Header />


      <section className="relative px-5 py-12 sm:px-8 lg:px-10 lg:py-18">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(22,163,74,0.10),transparent_34%),linear-gradient(315deg,rgba(249,115,22,0.12),transparent_38%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="animate-fade-up">
            <div className="mb-5 flex flex-wrap gap-2">
              {trustBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-primary/20 bg-primary-100 dark:bg-primary/20 px-4 py-2 text-xs font-black text-primary"
                >
                  {badge}
                </span>
              ))}
            </div>
            <h1 className="max-w-4xl text-balance text-4xl font-black leading-[0.96] tracking-normal text-foreground sm:text-6xl lg:text-7xl">
              Jualan Sepi? Naikin Closing 2-5x Pakai Landing Page
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-8 text-muted-foreground sm:text-lg">
              Cocok untuk seller Shopee, Tokopedia, dan dropshipper yang capek
              cuma dapat traffic tapi gak closing.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <WhatsAppButton>Konsultasi Gratis via WhatsApp</WhatsAppButton>
              <a
                href="#kenapa-kami"
                className="inline-flex min-h-13 items-center justify-center rounded-full border border-foreground/15 bg-accent/80 px-6 py-3 text-sm font-black text-foreground transition hover:-translate-y-0.5 hover:border-primary/50 sm:text-base"
              >
                Lihat masalahnya
              </a>
            </div>
          </div>
          <HeroMockup />
        </div>
      </section>

      <section id="kenapa-kami" className="border-y border-foreground/10 bg-surface py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-10">
          <div>
            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.24em] text-destructive">
              <HugeiconsIcon icon={AlertCircleIcon} size={20} />
              Masalah yang sering dialami seller
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              Traffic bocor sebelum buyer paham kenapa harus beli.
            </h2>
            <p className="mt-5 max-w-xl text-base font-semibold leading-8 text-muted-foreground">
              Di marketplace, buyer mudah terdistraksi oleh produk lain, voucher
              lain, dan harga yang terus dibandingkan. Landing page menahan
              perhatian mereka pada satu keputusan pembelian.
            </p>
          </div>
          <div className="grid gap-3">
            {problems.map((item, index) => (
              <div
                key={item.text}
                className="grid gap-4 rounded-[1.25rem] border border-foreground/10 bg-accent p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-destructive/35 sm:grid-cols-[3rem_1fr]"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-sm font-black text-destructive">
                  <HugeiconsIcon icon={item.icon} size={24} />
                </span>
                <p className="self-center text-lg font-black leading-7">
                  <span className="mr-2 text-destructive/70">0{index + 1}</span>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-18 sm:px-8 lg:grid-cols-[1fr_0.92fr] lg:px-10 lg:py-24">
        <div className="rounded-[1.75rem] border border-foreground/10 bg-primary p-6 text-primary-foreground dark:bg-accent dark:text-foreground">
          <div className="rounded-[1.25rem] bg-background p-4 text-foreground">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">
              Struktur halaman
            </p>
            {["Hook", "Problem", "Benefit", "Proof", "Offer", "FAQ", "CTA"].map(
              (item, index) => (
                <div
                  key={item}
                  className="mt-3 flex items-center gap-3 rounded-2xl border border-border p-3"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-sm font-black text-primary-foreground">
                    {index + 1}
                  </span>
                  <span className="font-black">{item}</span>
                  <span className="ml-auto h-2 w-16 rounded-full bg-primary-100 dark:bg-primary/20" />
                </div>
              ),
            )}
          </div>
        </div>
        <div className="self-center">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.24em] text-primary">
            <HugeiconsIcon icon={Target02Icon} size={20} />
            Solusinya
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
            Landing Page Khusus Closing
          </h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Kami buat landing page yang fokus jualan, bukan sekadar tampilan.
            Dirancang khusus untuk meningkatkan conversion dan memaksimalkan
            traffic yang sudah kamu punya.
          </p>
          <div className="mt-7 grid gap-3">
            {solutionHighlights.map((item) => (
              <div
                key={item.text}
                className="flex gap-3 rounded-2xl bg-primary-100 dark:bg-primary/20 p-4 text-primary"
              >
                <HugeiconsIcon className="mt-0.5 shrink-0" icon={item.icon} size={22} />
                <p className="font-black">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface py-18 sm:py-22">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.24em] text-primary">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} />
              Output yang siap dipakai
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              Yang kamu dapat:
            </h2>
            <p className="mt-5 text-base font-semibold leading-8 text-muted-foreground">
              Bukan file desain yang berhenti di preview. Kamu dapat halaman
              yang bisa langsung diarahkan dari iklan, bio, affiliate, atau
              chat follow-up.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {benefits.map((item) => (
              <article
                key={item.title}
                className="rounded-[1.25rem] border border-border bg-background p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/35"
              >
                <span className="mb-8 grid h-12 w-12 place-items-center rounded-2xl bg-primary-100 dark:bg-primary/20 text-primary">
                  <HugeiconsIcon icon={item.icon} size={25} />
                </span>
                <h3 className="text-2xl font-black leading-8">{item.title}</h3>
                <p className="mt-4 text-base font-semibold leading-7 text-muted-foreground">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-18 sm:px-8 lg:px-10 lg:py-24">
        <div className="mb-8 max-w-3xl">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.24em] text-primary">
            <HugeiconsIcon icon={Rocket02Icon} size={20} />
            Cara kerjanya
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
            Dari link produk ke halaman siap jual.
          </h2>
          <p className="mt-5 text-base font-semibold leading-8 text-muted-foreground">
            Alurnya dibuat pendek supaya seller bisa cepat validasi halaman,
            mulai promosi, dan melihat respon buyer tanpa proses teknis panjang.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <article key={step.title} className="rounded-[1.35rem] border border-border bg-accent p-6">
              <div className="flex items-start justify-between gap-4">
                <p className="text-5xl font-black text-primary/25">0{index + 1}</p>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-100 dark:bg-primary/20 text-primary">
                  <HugeiconsIcon icon={step.icon} size={25} />
                </span>
              </div>
              <h3 className="mt-10 text-2xl font-black">{step.title}</h3>
              <p className="mt-3 text-base font-semibold leading-7 text-muted-foreground">
                {step.desc}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="harga" className="bg-primary py-18 text-primary-foreground dark:bg-surface dark:text-foreground sm:py-22">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="text-center">
            <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.24em] text-primary-foreground/80 dark:text-primary">
              <HugeiconsIcon icon={CrownIcon} size={20} />
              Paket Harga
            </p>
            <h2 className="mt-4 text-4xl font-black sm:text-5xl text-white dark:text-foreground">Pilih paket, mulai closing.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-8 text-white/80 dark:text-muted-foreground">
              Mulai dari landing page tunggal sampai paket scale untuk campaign
              yang butuh variasi angle, urgency, dan tracking dasar. Slot
              terbatas, pengerjaan cepat (1-2 hari).
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {packages.map((item) => (
              <article
                key={item.name}
                className={`relative rounded-[1.5rem] border p-6 ${item.highlight
                  ? "border-primary-foreground bg-primary-foreground/10 text-white shadow-[0_28px_70px_rgba(0,179,208,0.26)]"
                  : "border-white/15 bg-white/8 text-white dark:bg-accent dark:text-foreground"
                  }`}
              >
                {item.highlight ? (
                  <span className="absolute right-5 top-5 rounded-full bg-white px-3 py-1 text-xs font-black text-primary">
                    Favorit
                  </span>
                ) : null}
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-current/10">
                    <HugeiconsIcon
                      icon={item.name === "Scale" ? Rocket02Icon : item.name === "Basic" ? Layout03Icon : CrownIcon}
                      size={24}
                    />
                  </span>
                  <p className="text-sm font-black uppercase tracking-[0.22em] opacity-75">
                    {item.name}
                  </p>
                </div>
                <p className="mt-5 text-4xl font-black">{item.price}</p>
                <ul className="mt-8 space-y-3">
                  {item.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-sm font-bold leading-6">
                      <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-current" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <WhatsAppButton variant={item.highlight ? "secondary" : "primary"}>
                    Ambil paket {item.name}
                  </WhatsAppButton>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="testimoni" className="mx-auto max-w-7xl px-5 py-18 sm:px-8 lg:px-10 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.24em] text-primary">
              <HugeiconsIcon icon={QuoteUpCircleIcon} size={20} />
              Testimoni
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              Seller lebih mudah menjelaskan value produk.
            </h2>
            <p className="mt-5 text-base font-semibold leading-8 text-muted-foreground">
              Halaman yang terstruktur mengurangi chat berulang, memperjelas
              alasan membeli, dan membuat seller lebih percaya diri saat
              mengirim traffic berbayar.
            </p>
          </div>
          <div className="grid gap-4">
            {testimonials.map((item) => (
              <blockquote
                key={item.name}
                className="rounded-[1.25rem] border border-border bg-accent p-6"
              >
                <HugeiconsIcon className="mb-5 text-primary" icon={QuoteUpCircleIcon} size={34} />
                <p className="text-xl font-black leading-9">
                  &quot;{item.review}&quot;
                </p>
                <footer className="mt-5 text-sm font-black text-primary">
                  {item.name}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface py-18 sm:py-22">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
          <div>
            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.24em] text-primary">
              <HugeiconsIcon icon={HelpCircleIcon} size={20} />
              FAQ
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              Pertanyaan sebelum mulai.
            </h2>
            <p className="mt-5 text-base font-semibold leading-8 text-muted-foreground">
              Kalau produk dan bahan jualanmu sudah siap, prosesnya biasanya
              cepat. Detail teknis seperti CTA, revisi, dan hosting bisa
              dibicarakan saat konsultasi.
            </p>
          </div>
          <div className="grid gap-3">
            {faqs.map((item) => (
              <details
                key={item.q}
                className="group rounded-[1.1rem] border border-border bg-background p-5"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 text-lg font-black">
                  <HugeiconsIcon className="shrink-0 text-primary" icon={HelpCircleIcon} size={22} />
                  {item.q}
                </summary>
                <p className="mt-3 text-base font-semibold leading-7 text-muted-foreground">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-10 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl rounded-[1.75rem] bg-primary p-7 text-primary-foreground sm:p-10 lg:p-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-4xl font-black leading-tight sm:text-6xl">
                Jangan buang traffic kamu sia-sia.
              </h2>
              <p className="mt-4 text-lg font-black opacity-75">
                Respon cepat. Konsultasi gratis.
              </p>
            </div>
            <WhatsAppButton variant="secondary">Chat WhatsApp Sekarang</WhatsAppButton>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-primary/5 px-5 py-10 text-foreground dark:bg-black sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-bold text-muted-foreground">(c) 2026 Pasaria.id - Jasa Landing Page Indonesia</p>
          <div className="flex gap-5 text-sm font-black text-muted-foreground">
            <a href="https://wa.me/6281200000000?text=Halo%20Pasaria%2C%20saya%20mau%20konsultasi%20landing%20page" className="hover:text-primary">
              WhatsApp
            </a>
            <a href="#" className="hover:text-primary">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
