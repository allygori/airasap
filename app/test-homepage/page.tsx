import type { Metadata } from 'next';
import { createElement } from 'react';
import type { ReactNode } from 'react';
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
} from '@hugeicons/core-free-icons';
import { Header } from '../../components/shared/layout/header';
// import { HugeiconsIcon } from "../../components/shared/huge-icon";
import { HugeiconsIcon } from '@hugeicons/react';

export const metadata: Metadata = {
  title: 'Pasaria.id - Jasa Landing Page Indonesia',
  description:
    'Landing page conversion-first untuk seller marketplace, dropshipper, dan brand yang ingin menaikkan closing dari traffic yang sudah ada.',
};

const trustBadges = [
  'Dipakai 50+ seller',
  'Fast delivery 1-2 hari',
];

const problems = [
  {
    icon: ChartUpIcon,
    text: 'Traffic banyak tapi jarang closing',
  },
  {
    icon: MoneyReceiveCircleIcon,
    text: 'Harga kalah saing terus di marketplace',
  },
  {
    icon: CursorPointer02Icon,
    text: 'Pembeli cuma lihat-lihat, gak beli',
  },
  {
    icon: HelpCircleIcon,
    text: 'Susah jelasin produk secara lengkap',
  },
  {
    icon: Megaphone02Icon,
    text: 'Iklan mahal tapi ROI kecil',
  },
];

const solutionHighlights = [
  {
    icon: Target02Icon,
    text: 'Struktur copywriting yang terbukti convert',
  },
  {
    icon: Layout03Icon,
    text: 'Desain clean & fokus ke pembelian',
  },
  {
    icon: MobileNavigator02Icon,
    text: 'Mobile optimized (90% traffic dari HP)',
  },
  {
    icon: Megaphone02Icon,
    text: 'Bisa langsung dipakai untuk iklan',
  },
];

const benefits = [
  {
    icon: ShoppingCartCheck02Icon,
    title: 'Closing lebih tinggi tanpa nambah traffic',
    body: 'Traffic yang sama diarahkan ke halaman yang menjawab ragu buyer sebelum masuk chat.',
  },
  {
    icon: MoneyReceiveCircleIcon,
    title: 'Gak perlu perang harga terus',
    body: 'Produk dijual dengan konteks, benefit, bukti, dan bonus sehingga value lebih mudah terasa.',
  },
  {
    icon: Rocket02Icon,
    title: 'Lebih mudah scale iklan',
    body: 'Struktur halaman siap dipakai ulang untuk campaign Meta Ads, TikTok, affiliate, atau broadcast.',
  },
  {
    icon: CrownIcon,
    title: 'Brand terlihat lebih profesional',
    body: 'Visual, copy, dan CTA dibuat rapi agar buyer merasa sedang membeli dari seller yang serius.',
  },
  {
    icon: Package02Icon,
    title: 'Bisa dipakai ulang untuk banyak campaign',
    body: 'Satu landing page bisa jadi aset utama untuk promo bulanan, launch produk, dan retargeting.',
  },
];

const steps = [
  {
    icon: Package02Icon,
    title: 'Kirim Produk',
    desc: 'Kirim link Shopee / Tokopedia kamu',
  },
  {
    icon: Layout03Icon,
    title: 'Kami Buatkan',
    desc: 'Landing page siap jual dalam 1-2 hari',
  },
  {
    icon: WhatsappIcon,
    title: 'Langsung Pakai',
    desc: 'Gunakan untuk iklan & closing via WhatsApp',
  },
];

const packages = [
  {
    name: 'Basic',
    price: 'Rp 300.000',
    features: [
      '1 Landing Page',
      'Mobile optimized',
      'CTA WhatsApp',
      'Revisi 1x',
    ],
    highlight: false,
  },
  {
    name: 'Best Seller',
    price: 'Rp 500.000',
    features: [
      'Copywriting optimized',
      'Struktur high-converting',
      'Desain premium',
      'Revisi 2x',
      'Bonus setup CTA',
    ],
    highlight: true,
  },
  {
    name: 'Scale',
    price: 'Rp 900.000',
    features: [
      '2 variasi landing page',
      'Angle copywriting campaign',
      'Section bonus & urgency',
      'Revisi 3x',
      'Setup tracking event dasar',
      'Prioritas pengerjaan',
    ],
    highlight: false,
  },
];

const testimonials = [
  {
    name: 'Andi - Seller Fashion',
    review:
      'Sebelumnya closing susah banget, setelah pakai landing page ini naik hampir 3x.',
  },
  {
    name: 'Rina - Dropshipper',
    review:
      'Lebih enak jualan, gak perlu jelasin panjang di chat.',
  },
];

const faqs = [
  {
    q: 'Berapa lama pengerjaan?',
    a: '1-2 hari setelah data lengkap.',
  },
  {
    q: 'Apakah bisa revisi?',
    a: 'Ya, sesuai paket yang dipilih.',
  },
  {
    q: 'Perlu hosting sendiri?',
    a: 'Bisa kami bantu setup atau pakai opsi gratis.',
  },
  {
    q: 'Cocok untuk produk apa?',
    a: 'Semua produk digital & fisik yang butuh peningkatan closing.',
  },
];

function WhatsAppButton({
  children,
  variant = 'primary',
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
}) {
  const classes =
    variant === 'primary'
      ? 'bg-primary text-primary-foreground shadow-[0_18px_44px_rgba(0,179,208,0.28)] hover:bg-primary-600'
      : 'border border-foreground/15 bg-accent/80 text-foreground hover:border-primary/50';

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
    <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
      <div className="bg-primary/25 absolute top-8 -left-6 h-32 w-32 rounded-full blur-3xl" />
      <div className="bg-primary/20 absolute -right-8 bottom-2 h-44 w-44 rounded-full blur-3xl" />
      <div className="animate-fade-up border-border bg-accent/78 relative rotate-[-1.5deg] rounded-[1.65rem] border p-3 shadow-[0_25px_70px_rgba(0,179,208,0.2)] backdrop-blur-xl dark:shadow-[0_25px_70px_rgba(0,0,0,0.42)]">
        <div className="border-border bg-background grid gap-4 rounded-[1.25rem] border p-4 lg:grid-cols-[1.22fr_0.78fr]">
          <div className="border-border bg-muted/30 text-foreground relative min-h-[32rem] overflow-hidden rounded-[1.45rem] border p-2">
            <div className="absolute inset-x-8 top-2 h-28 rounded-full bg-[linear-gradient(180deg,rgba(0,179,208,0.1),transparent)] opacity-50 blur-2xl" />
            <div className="animate-scan absolute top-0 right-4 left-4 h-24 bg-[linear-gradient(180deg,transparent,rgba(0,179,208,0.15),transparent)] opacity-50" />
            <div className="dark:bg-background relative mx-auto h-full max-w-[19rem] rounded-[2rem] border-[10px] border-slate-950 bg-white p-3 text-slate-950 shadow-2xl dark:border-black">
              <div className="dark:bg-foreground/20 mx-auto mb-3 h-1.5 w-16 rounded-full bg-slate-300" />
              <div className="bg-primary text-primary-foreground rounded-2xl p-4">
                <div className="flex items-center gap-2 text-[0.62rem] font-black tracking-[0.22em] uppercase opacity-80">
                  <HugeiconsIcon
                    icon={Layout03Icon}
                    size={15}
                  />
                  Product landing
                </div>
                <p className="mt-7 text-3xl leading-none font-black">
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
                    className="bg-primary/10 flex h-16 items-end rounded-2xl p-2"
                  >
                    <span
                      className="bg-primary block w-full rounded-xl"
                      style={{ height: `${height}%` }}
                    />
                  </span>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                {[100, 78, 56].map((width) => (
                  <span
                    key={width}
                    className="dark:bg-foreground/10 block h-2 rounded-full bg-slate-200"
                    style={{ width: `${width}%` }}
                  />
                ))}
              </div>
              <div className="bg-primary text-primary-foreground mt-5 rounded-full px-4 py-3 text-center text-xs font-black">
                <span className="inline-flex items-center gap-2">
                  <HugeiconsIcon
                    icon={ShoppingBasket03Icon}
                    size={16}
                  />
                  Order Sekarang
                </span>
              </div>
            </div>
          </div>
          <div className="grid gap-3">
            <div className="border-destructive/25 bg-destructive/5 dark:bg-destructive/10 rounded-[1.25rem] border p-5">
              <p className="text-destructive text-xs font-black tracking-[0.24em] uppercase">
                Before
              </p>
              <p className="text-destructive mt-6 text-4xl font-black">
                1.1%
              </p>
              <p className="text-muted-foreground mt-2 text-sm font-semibold">
                klik datang, buyer hilang di etalase
                kompetitor.
              </p>
            </div>
            <div className="border-primary/25 bg-primary/10 rounded-[1.25rem] border p-5">
              <p className="text-primary text-xs font-black tracking-[0.24em] uppercase">
                After
              </p>
              <p className="text-primary mt-6 text-4xl font-black">
                3.8%
              </p>
              <p className="text-muted-foreground mt-2 text-sm font-semibold">
                satu produk, satu cerita, satu tombol
                closing.
              </p>
            </div>
            <div className="border-foreground/10 bg-surface rounded-[1.25rem] border p-5">
              <p className="text-sm font-black">
                Campaign siap jalan
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  'Meta Ads',
                  'TikTok',
                  'Bio Link',
                  'Affiliate',
                ].map((item) => (
                  <span
                    key={item}
                    className="bg-accent text-muted-foreground rounded-full px-3 py-2 text-xs font-bold"
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
    <main className="bg-background text-foreground min-h-screen overflow-hidden">
      <Header />

      <section className="relative isolate px-5 py-8 sm:px-8 lg:px-10">
        {/* Similar gradient background to start-selling */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(0,179,208,0.15),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(14,14,17,0.15),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.62),transparent_38%)] dark:bg-[radial-gradient(circle_at_15%_10%,rgba(0,179,208,0.1),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(14,14,17,0.1),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_38%)]" />

        <div className="mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl items-center gap-10 pt-6 pb-8 lg:grid-cols-[1.02fr_0.98fr] lg:pt-8 lg:pb-10">
          <div className="animate-fade-up">
            <div className="mb-5 flex flex-wrap gap-2">
              {trustBadges.map((badge) => (
                <span
                  key={badge}
                  className="border-primary/20 bg-primary/10 text-primary rounded-full border px-4 py-2 text-xs font-black"
                >
                  {badge}
                </span>
              ))}
            </div>
            <h1 className="text-foreground max-w-4xl text-4xl leading-[0.92] font-black tracking-normal text-balance sm:text-6xl lg:text-7xl">
              Jualan Sepi? Naikin Closing 2-5x Pakai Landing
              Page
            </h1>
            <p className="text-muted-foreground mt-6 max-w-2xl text-base leading-8 text-pretty sm:text-lg">
              Cocok untuk seller Shopee, Tokopedia, dan
              dropshipper yang capek cuma dapat traffic tapi
              gak closing.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <WhatsAppButton>
                Konsultasi Gratis via WA
              </WhatsAppButton>
              <a
                href="#kenapa-kami"
                className="border-foreground/15 bg-accent/80 text-foreground hover:border-primary/40 inline-flex min-h-13 items-center justify-center gap-2 rounded-full border px-7 py-3 text-base font-black backdrop-blur transition duration-300 hover:-translate-y-1"
              >
                <HugeiconsIcon
                  icon={HelpCircleIcon}
                  size={21}
                />
                Lihat masalahnya
              </a>
            </div>
          </div>
          <HeroMockup />
        </div>
      </section>

      <section
        id="kenapa-kami"
        className="border-foreground/10 bg-surface border-y py-20 lg:py-28"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-10">
          <div>
            <p className="text-danger flex items-center gap-2 text-sm font-black tracking-[0.24em] uppercase">
              <HugeiconsIcon
                icon={AlertCircleIcon}
                size={20}
              />
              Masalah yang sering dialami seller
            </p>
            <h2 className="mt-5 text-4xl leading-tight font-black sm:text-6xl">
              Traffic bocor sebelum buyer paham kenapa harus
              beli.
            </h2>
            <p className="text-muted-foreground mt-6 max-w-xl text-base leading-8 font-semibold">
              Di marketplace, buyer mudah terdistraksi oleh
              produk lain, voucher lain, dan harga yang
              terus dibandingkan. Landing page menahan
              perhatian mereka pada satu keputusan
              pembelian.
            </p>
          </div>
          <div className="grid gap-4">
            {problems.map((item, index) => (
              <div
                key={item.text}
                className="border-border bg-accent hover:border-destructive/40 grid gap-4 rounded-[1.5rem] border p-5 shadow-sm transition duration-300 hover:-translate-y-1 sm:grid-cols-[4rem_1fr]"
              >
                <span className="bg-destructive/10 text-destructive grid h-16 w-16 place-items-center rounded-2xl text-xl font-black">
                  <HugeiconsIcon
                    icon={item.icon}
                    size={28}
                  />
                </span>
                <p className="self-center text-xl leading-8 font-bold">
                  <span className="text-destructive/70 mr-2">
                    0{index + 1}
                  </span>
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
              <p className="text-b-primary flex items-center gap-2 text-sm font-black tracking-[0.24em] uppercase">
                <HugeiconsIcon
                  icon={Target02Icon}
                  size={20}
                />
                Solusinya
              </p>
              <h2 className="mt-5 text-4xl leading-tight font-black sm:text-6xl">
                Landing Page Khusus Closing
              </h2>
              <p className="text-muted-foreground mt-6 text-lg leading-8">
                Kami buat landing page yang fokus jualan,
                bukan sekadar tampilan. Dirancang khusus
                untuk meningkatkan conversion dan
                memaksimalkan traffic yang sudah kamu punya.
              </p>
            </div>
            <div className="border-border bg-muted/30 grid gap-3 rounded-[1.5rem] border p-4">
              {[
                'Hook',
                'Problem',
                'Benefit',
                'Proof',
                'Offer',
                'FAQ',
                'CTA',
              ].map((item, index) => (
                <div
                  key={item}
                  className="border-border bg-background hover:border-primary/40 flex items-center gap-3 rounded-2xl border p-3 transition duration-300 hover:translate-x-1"
                >
                  <span className="bg-primary text-primary-foreground grid h-10 w-10 place-items-center rounded-xl text-sm font-black">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm font-black">
                    {item}
                  </span>
                  <span
                    className={`h-2 rounded-full ${index === 6 ? 'bg-primary w-20' : 'bg-primary/35 w-14'}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {benefits.map((item) => (
              <article
                key={item.title}
                className="group border-border bg-accent hover:border-primary/35 rounded-[1.5rem] border p-7 shadow-sm transition duration-300 hover:-translate-y-1"
              >
                <span className="bg-primary/10 text-primary group-hover:bg-primary/20 mb-8 grid h-12 w-12 place-items-center rounded-2xl transition duration-300 group-hover:rotate-3">
                  <HugeiconsIcon
                    icon={item.icon}
                    size={26}
                  />
                </span>
                <h3 className="text-2xl font-black">
                  {item.title}
                </h3>
                <p className="text-muted-foreground mt-4 text-base leading-8">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="border-border bg-primary text-primary-foreground grid overflow-hidden rounded-[2rem] border shadow-[0_35px_90px_rgba(0,179,208,0.25)] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="p-7 sm:p-10 lg:p-12">
            <p className="flex items-center gap-2 text-sm font-black tracking-[0.24em] uppercase opacity-75">
              <HugeiconsIcon
                icon={Rocket02Icon}
                size={20}
              />
              Cara kerjanya
            </p>
            <h2 className="mt-5 text-4xl leading-tight font-black sm:text-6xl">
              Dari link produk ke halaman siap jual.
            </h2>
            <p className="mt-6 text-lg leading-8 font-medium opacity-80">
              Alurnya dibuat pendek supaya seller bisa cepat
              validasi halaman, mulai promosi, dan melihat
              respon buyer tanpa proses teknis panjang.
            </p>
          </div>
          <div className="grid gap-px bg-white/15 p-px sm:grid-cols-1">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="bg-primary flex items-center gap-6 p-7 transition duration-300 hover:bg-white/10 sm:p-8 dark:hover:bg-black/10"
              >
                <p className="text-5xl font-black opacity-35">
                  0{index + 1}
                </p>
                <div>
                  <h3 className="text-xl font-black">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-base font-medium opacity-80">
                    {step.desc}
                  </p>
                </div>
                <span className="ml-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/15 dark:bg-black/10">
                  <HugeiconsIcon
                    icon={step.icon}
                    size={25}
                  />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="harga"
        className="bg-surface py-20 lg:py-28"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="text-center">
            <p className="text-b-secondary inline-flex items-center gap-2 text-sm font-black tracking-[0.24em] uppercase">
              <HugeiconsIcon icon={CrownIcon} size={20} />
              Paket Harga
            </p>
            <h2 className="mt-4 text-4xl font-black sm:text-6xl">
              Pilih paket, mulai closing.
            </h2>
            <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-base leading-8 font-semibold">
              Mulai dari landing page tunggal sampai paket
              scale untuk campaign yang butuh variasi angle,
              urgency, dan tracking dasar. Slot terbatas,
              pengerjaan cepat (1-2 hari).
            </p>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {packages.map((item) => (
              <article
                key={item.name}
                className={`relative rounded-[1.5rem] border p-8 transition duration-300 hover:-translate-y-1 ${
                  item.highlight
                    ? 'border-primary bg-primary text-primary-foreground shadow-[0_28px_70px_rgba(0,179,208,0.28)]'
                    : 'border-border bg-accent text-foreground hover:border-primary/40 shadow-sm'
                }`}
              >
                {item.highlight ? (
                  <span className="text-b-secondary absolute top-6 right-6 rounded-full bg-[#1f1308] px-3 py-1 text-xs font-black">
                    Favorit
                  </span>
                ) : null}
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-2xl ${item.highlight ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}
                  >
                    <HugeiconsIcon
                      icon={
                        item.name === 'Scale'
                          ? Rocket02Icon
                          : item.name === 'Basic'
                            ? Layout03Icon
                            : CrownIcon
                      }
                      size={26}
                    />
                  </span>
                  <p className="text-sm font-black tracking-[0.22em] uppercase opacity-75">
                    {item.name}
                  </p>
                </div>
                <p className="mt-6 text-4xl font-black">
                  {item.price}
                </p>
                <ul className="mt-8 space-y-4">
                  {item.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-3 text-base leading-6 font-bold"
                    >
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
                        ? 'text-primary bg-white hover:bg-white/90'
                        : 'bg-primary text-primary-foreground hover:bg-primary-600'
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

      <section
        id="testimoni"
        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28"
      >
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <p className="text-primary flex items-center gap-2 text-sm font-black tracking-[0.24em] uppercase">
              <HugeiconsIcon
                icon={QuoteUpCircleIcon}
                size={20}
              />
              Testimoni
            </p>
            <h2 className="mt-5 text-4xl leading-tight font-black sm:text-6xl">
              Seller lebih mudah menjelaskan value produk.
            </h2>
            <p className="text-muted-foreground mt-6 text-base leading-8 font-semibold">
              Halaman yang terstruktur mengurangi chat
              berulang, memperjelas alasan membeli, dan
              membuat seller lebih percaya diri saat
              mengirim traffic berbayar.
            </p>
          </div>
          <div className="grid gap-4">
            {testimonials.map((item) => (
              <blockquote
                key={item.name}
                className="border-foreground/10 bg-accent hover:border-primary/40 rounded-[1.5rem] border p-7 shadow-sm transition hover:-translate-y-1"
              >
                <HugeiconsIcon
                  className="text-primary mb-6"
                  icon={QuoteUpCircleIcon}
                  size={36}
                />
                <p className="text-2xl leading-10 font-black">
                  &quot;{item.review}&quot;
                </p>
                <footer className="text-primary mt-6 text-sm font-black">
                  {item.name}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-accent/30 py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
          <div>
            <p className="text-primary flex items-center gap-2 text-sm font-black tracking-[0.24em] uppercase">
              <HugeiconsIcon
                icon={HelpCircleIcon}
                size={20}
              />
              FAQ
            </p>
            <h2 className="mt-5 text-4xl leading-tight font-black sm:text-6xl">
              Pertanyaan sebelum mulai.
            </h2>
            <p className="text-muted-foreground mt-6 text-base leading-8 font-semibold">
              Kalau produk dan bahan jualanmu sudah siap,
              prosesnya biasanya cepat. Detail teknis
              seperti CTA, revisi, dan hosting bisa
              dibicarakan saat konsultasi.
            </p>
          </div>
          <div className="grid gap-4">
            {faqs.map((item) => (
              <details
                key={item.q}
                className="group border-border bg-background rounded-[1.25rem] border p-6 shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center gap-4 text-xl font-black">
                  <HugeiconsIcon
                    className="text-primary shrink-0"
                    icon={HelpCircleIcon}
                    size={24}
                  />
                  {item.q}
                </summary>
                <p className="text-muted-foreground mt-4 pl-10 text-base leading-8 font-semibold">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pt-10 pb-10 sm:px-8 lg:px-10">
        <div className="border-foreground/10 bg-accent mx-auto max-w-7xl rounded-[2rem] border p-7 shadow-[0_28px_80px_rgba(10,74,74,0.14)] sm:p-10 lg:p-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-primary flex items-center gap-2 text-sm font-black tracking-[0.26em] uppercase">
                <HugeiconsIcon
                  icon={Rocket02Icon}
                  size={20}
                />
                Mulai Sekarang
              </p>
              <h2 className="mt-5 text-4xl leading-tight font-black sm:text-6xl">
                Jangan buang traffic kamu sia-sia.
              </h2>
              <p className="text-muted-foreground mt-6 text-lg leading-8 font-medium">
                Respon cepat. Konsultasi gratis.
              </p>
            </div>
            <div>
              <a
                href="https://wa.me/6281200000000?text=Halo%20Pasaria%2C%20saya%20mau%20konsultasi%20landing%20page"
                className="bg-primary text-primary-foreground hover:bg-primary-600 inline-flex min-h-[3.5rem] items-center justify-center gap-2 rounded-full px-8 py-3 text-lg font-black shadow-[0_22px_50px_rgba(0,179,208,0.35)] transition duration-300 hover:-translate-y-1"
              >
                <HugeiconsIcon
                  icon={WhatsappIcon}
                  size={22}
                />
                Chat WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-border bg-accent/30 border-t px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-primary text-primary-foreground grid h-10 w-10 place-items-center rounded-full text-sm font-black">
              <HugeiconsIcon icon={Store04Icon} size={20} />
            </span>
            <div>
              <p className="text-primary text-sm font-black tracking-[0.28em] uppercase">
                Pasaria
              </p>
              <p className="text-muted-foreground text-sm font-medium">
                Jasa Landing Page
              </p>
            </div>
          </div>
          <div className="text-muted-foreground flex gap-6 text-sm font-bold">
            <a
              href="https://wa.me/6281200000000?text=Halo%20Pasaria%2C%20saya%20mau%20konsultasi%20landing%20page"
              className="hover:text-primary"
            >
              WhatsApp
            </a>
            <a href="#" className="hover:text-primary">
              Privacy Policy
            </a>
          </div>
        </div>
        <div className="border-border text-muted-foreground mx-auto mt-10 max-w-7xl border-t pt-6 text-sm font-semibold">
          <p>© 2026 Pasaria.id. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
