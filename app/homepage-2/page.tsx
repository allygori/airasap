import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  ChevronRight,
  ClipboardList,
  FileSpreadsheet,
  Gauge,
  Layers3,
  LineChart,
  PackageCheck,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  WalletCards,
} from 'lucide-react';

export const metadata: Metadata = {
  title:
    'Airasap Profit Intelligence untuk Seller Marketplace',
  description:
    'Dashboard profit marketplace untuk seller Shopee Indonesia. Upload Excel, tambah HPP produk, lalu lihat laba bersih, produk bocor, dan rekomendasi perbaikan.',
};

const metrics = [
  { label: 'Revenue terlacak', value: 'Rp148,2jt' },
  { label: 'Profit bersih', value: 'Rp31,7jt' },
  { label: 'Margin rata-rata', value: '21,4%' },
];

const painPoints = [
  'Omzet marketplace terlihat besar, tapi laba bersihnya masih ditebak.',
  'Biaya admin, diskon, ongkir, dan voucher tersebar di file laporan.',
  'HPP berubah-ubah, sementara seller butuh snapshot profit yang rapi.',
  'Produk ramai order belum tentu produk yang paling menguntungkan.',
];

const workflow = [
  {
    icon: Upload,
    title: 'Upload file Shopee',
    description:
      'Mulai dari laporan Excel marketplace yang sudah seller pakai hari ini.',
  },
  {
    icon: Boxes,
    title: 'Tambahkan HPP produk',
    description:
      'COGS disimpan sebagai snapshot agar perhitungan profit tetap konsisten.',
  },
  {
    icon: LineChart,
    title: 'Baca profit sebenarnya',
    description:
      'Lihat margin, biaya, kontribusi produk, dan rekomendasi tindakan.',
  },
];

const features = [
  {
    icon: Gauge,
    title: 'Overview',
    description:
      'Ringkasan omzet, laba, margin, order, dan sinyal kesehatan toko dalam satu layar.',
  },
  {
    icon: PackageCheck,
    title: 'Products',
    description:
      'Daftar produk dengan COGS, quantity, revenue, profit, dan ranking kontribusi.',
  },
  {
    icon: ReceiptText,
    title: 'Orders',
    description:
      'Audit order satu per satu untuk melihat biaya yang menggerus margin.',
  },
  {
    icon: ClipboardList,
    title: 'Reports',
    description:
      'Rencana laporan periodik untuk evaluasi campaign, SKU, dan channel marketplace.',
  },
];

const signals = [
  'Produk margin tinggi yang layak dinaikkan budget iklannya',
  'Produk ramai order tapi profit tipis atau minus',
  'Estimasi dampak HPP terhadap laba bersih',
  'Perbandingan revenue, COGS, dan biaya marketplace',
];

const roadmap = [
  'Shopee',
  'Tokopedia',
  'TikTok Shop',
  'Lazada',
];

const dashboardNavItems = [
  { label: 'Overview', icon: BarChart3 },
  { label: 'Products', icon: Boxes },
  { label: 'Orders', icon: ReceiptText },
  { label: 'Reports', icon: ClipboardList },
];

export default function Homepage2Page() {
  return (
    <main className="min-h-screen bg-[#f5f3eb] text-[#161613]">
      <section className="relative overflow-hidden border-b border-[#161613]/10 bg-[#f5f3eb]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(22,22,19,0.055)_1px,transparent_1px),linear-gradient(rgba(22,22,19,0.055)_1px,transparent_1px)] bg-[size:38px_38px]" />
        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-10">
          <header className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="flex items-center gap-3"
              aria-label="Airasap homepage"
            >
              <span className="grid size-10 place-items-center rounded-md bg-[#161613] text-sm font-black text-[#f5f3eb]">
                Ai
              </span>
              <span className="text-sm font-extrabold tracking-[0.18em] uppercase">
                Airasap
              </span>
            </Link>
            <nav className="hidden items-center gap-7 text-sm font-semibold text-[#4c4a41] md:flex">
              <a href="#fitur">Fitur</a>
              <a href="#cara-kerja">Cara kerja</a>
              <a href="#roadmap">Roadmap</a>
              <a href="#harga">Harga</a>
            </nav>
            <Link
              href="/tools/marketplace-profit-intelligence"
              className="inline-flex items-center gap-2 rounded-md bg-[#00b3d0] px-4 py-2.5 text-sm font-bold text-white shadow-[4px_4px_0_#161613]"
            >
              Coba gratis
              <ArrowRight className="size-4" />
            </Link>
          </header>

          <div className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:py-8">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-[#161613]/15 bg-white/70 px-3 py-2 text-sm font-bold text-[#3a372f] shadow-sm">
                <Sparkles className="size-4 text-[#00b3d0]" />
                Profit intelligence untuk seller marketplace
              </div>
              <h1 className="max-w-4xl text-5xl leading-[0.95] font-black tracking-tight text-[#161613] sm:text-6xl lg:text-7xl">
                Jangan tunggu akhir bulan untuk tahu toko
                untung atau bocor.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4c4a41]">
                Upload laporan Shopee, tambahkan HPP produk,
                lalu Airasap menghitung laba bersih, margin,
                produk paling sehat, dan rekomendasi yang
                bisa langsung dipakai untuk mengambil
                keputusan.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/tools/marketplace-profit-intelligence"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-[#161613] px-6 py-4 text-base font-extrabold text-white shadow-[6px_6px_0_#00d085] transition-transform hover:-translate-y-0.5"
                >
                  Analisis file Shopee
                  <ArrowRight className="size-5" />
                </Link>
                <a
                  href="#demo"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-[#161613]/20 bg-white px-6 py-4 text-base font-extrabold text-[#161613]"
                >
                  Lihat dashboard
                  <ChevronRight className="size-5" />
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {[
                  'Manual Excel dulu',
                  'Shopee supported',
                  'Marketplace lain segera',
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-md border border-[#161613]/15 bg-white/70 px-3 py-2 text-sm font-bold text-[#4c4a41]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <DashboardPreview />
          </div>
        </div>
      </section>

      <section className="bg-[#161613] px-5 py-8 text-white sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="border-l border-white/15 px-5 py-2"
            >
              <p className="text-sm font-semibold text-white/55">
                {metric.label}
              </p>
              <p className="mt-2 text-3xl font-black">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-black tracking-[0.18em] text-[#007f95] uppercase">
              Masalah seller
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Marketplace memberi laporan. Seller tetap
              butuh jawaban.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {painPoints.map((item) => (
              <div
                key={item}
                className="rounded-md border border-[#161613]/12 bg-white p-5 shadow-sm"
              >
                <Search className="mb-8 size-6 text-[#00b3d0]" />
                <p className="text-lg leading-7 font-extrabold">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="demo"
        className="border-y border-[#161613]/10 bg-white px-5 py-20 sm:px-8 lg:px-10"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="order-2 lg:order-1">
            <InsightBoard />
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-sm font-black tracking-[0.18em] text-[#007f95] uppercase">
              Dari file ke keputusan
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Bukan cuma tabel profit. Airasap membaca pola
              penjualan.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#4c4a41]">
              Seller bisa melihat mana produk yang harus
              dipertahankan, mana yang perlu naik harga, dan
              mana yang terlihat ramai tapi diam-diam
              menghabiskan margin.
            </p>
            <div className="mt-8 space-y-3">
              {signals.map((signal) => (
                <div
                  key={signal}
                  className="flex items-start gap-3 rounded-md bg-[#f5f3eb] p-4"
                >
                  <Check className="mt-0.5 size-5 shrink-0 text-[#00a96b]" />
                  <span className="font-bold text-[#2d2b25]">
                    {signal}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="cara-kerja"
        className="px-5 py-20 sm:px-8 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-black tracking-[0.18em] text-[#007f95] uppercase">
              Cara kerja
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Tetap sederhana untuk MVP, kuat untuk operasi
              harian.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {workflow.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className="rounded-md border border-[#161613]/12 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-[#8d8877]">
                      0{index + 1}
                    </span>
                    <Icon className="size-7 text-[#00b3d0]" />
                  </div>
                  <h3 className="mt-12 text-2xl font-black">
                    {step.title}
                  </h3>
                  <p className="mt-3 leading-7 text-[#5d5a50]">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="fitur"
        className="bg-[#e8f7f6] px-5 py-20 sm:px-8 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <p className="text-sm font-black tracking-[0.18em] text-[#007f95] uppercase">
                Dashboard
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                Dibangun mengikuti cara seller memeriksa
                bisnisnya.
              </h2>
            </div>
            <div className="rounded-md bg-[#161613] px-4 py-3 text-sm font-bold text-white">
              Overview / Products / Orders / Reports
            </div>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-md bg-white p-6 shadow-[0_1px_0_rgba(22,22,19,0.12)]"
                >
                  <Icon className="size-7 text-[#00b3d0]" />
                  <h3 className="mt-8 text-2xl font-black">
                    {feature.title}
                  </h3>
                  <p className="mt-3 leading-7 text-[#5d5a50]">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="roadmap"
        className="px-5 py-20 sm:px-8 lg:px-10"
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-black tracking-[0.18em] text-[#007f95] uppercase">
              Roadmap marketplace
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Mulai dari Shopee, lalu menjadi pusat profit
              multi-channel.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#4c4a41]">
              MVP dibuat manual dengan upload Excel agar
              cepat dipakai. Setelah pola data matang,
              Airasap akan masuk ke marketplace Indonesia
              lain dan membuka struktur data yang lebih siap
              untuk otomasi.
            </p>
          </div>
          <div className="grid gap-3">
            {roadmap.map((item, index) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-md border border-[#161613]/12 bg-white p-5"
              >
                <div className="flex items-center gap-4">
                  <span className="grid size-10 place-items-center rounded-md bg-[#161613] text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <span className="text-xl font-black">
                    {item}
                  </span>
                </div>
                <span className="rounded-md bg-[#f5f3eb] px-3 py-2 text-sm font-bold text-[#5d5a50]">
                  {index === 0 ? 'Active' : 'Planned'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="harga"
        className="bg-[#161613] px-5 py-20 text-white sm:px-8 lg:px-10"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_0.85fr]">
          <div>
            <p className="text-sm font-black tracking-[0.18em] text-[#00d085] uppercase">
              Lead generator + SaaS
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Beri seller satu analisis gratis. Konversi ke
              dashboard berulang.
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/70">
              Free tool menangkap seller yang sudah punya
              masalah jelas: mereka punya file marketplace
              dan ingin tahu laba. Produk berbayar menyimpan
              riwayat COGS, dashboard, rekomendasi, dan
              laporan berkala.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/tools/marketplace-profit-intelligence"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#00b3d0] px-6 py-4 text-base font-extrabold text-white"
              >
                Coba free tool
                <FileSpreadsheet className="size-5" />
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 px-6 py-4 text-base font-extrabold text-white"
              >
                Masuk waiting list
                <ArrowRight className="size-5" />
              </Link>
            </div>
          </div>
          <div className="rounded-md border border-white/15 bg-white p-6 text-[#161613]">
            <div className="flex items-center justify-between border-b border-[#161613]/10 pb-5">
              <div>
                <p className="text-sm font-black tracking-[0.18em] text-[#007f95] uppercase">
                  Early seller plan
                </p>
                <p className="mt-2 text-4xl font-black">
                  Rp99rb
                </p>
              </div>
              <WalletCards className="size-9 text-[#00b3d0]" />
            </div>
            <div className="mt-6 space-y-4">
              {[
                'Upload laporan Shopee bulanan',
                'Snapshot COGS per produk',
                'Dashboard profit dan margin',
                'Rekomendasi produk prioritas',
                'Reports dan marketplace lain saat rilis',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3"
                >
                  <Check className="size-5 text-[#00a96b]" />
                  <span className="font-bold">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function DashboardPreview() {
  return (
    <div className="relative" id="dashboard-preview">
      <div className="absolute -top-3 -right-3 hidden h-full w-full rounded-md bg-[#00d085] lg:block" />
      <div className="relative overflow-hidden rounded-md border-2 border-[#161613] bg-[#11110f] shadow-[10px_10px_0_rgba(22,22,19,0.25)]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex gap-2">
            <span className="size-3 rounded-full bg-[#ff5f57]" />
            <span className="size-3 rounded-full bg-[#ffbd2e]" />
            <span className="size-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="text-xs font-bold text-white/45">
            profit-intelligence.airasap
          </span>
        </div>
        <div className="grid min-h-[560px] grid-cols-[72px_1fr] sm:grid-cols-[180px_1fr]">
          <aside className="border-r border-white/10 bg-[#191915] p-3 sm:p-4">
            <div className="mb-8 hidden text-sm font-black text-white sm:block">
              Airasap PI
            </div>
            <div className="space-y-2">
              {dashboardNavItems.map(
                ({ label, icon: Icon }, index) => (
                  <div
                    key={label}
                    className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm font-bold ${
                      index === 0
                        ? 'bg-[#00b3d0] text-white'
                        : 'text-white/55'
                    }`}
                  >
                    <Icon className="size-5" />
                    <span className="hidden sm:inline">
                      {label}
                    </span>
                  </div>
                )
              )}
            </div>
          </aside>
          <div className="p-4 sm:p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-bold text-[#00d085]">
                  Shopee Report / May 2026
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">
                  Profit Overview
                </h2>
              </div>
              <button className="inline-flex items-center gap-2 self-start rounded-md bg-white px-3 py-2 text-sm font-black text-[#161613]">
                <Upload className="size-4" />
                Upload
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['Net Sales', 'Rp148,2jt', '+18%'],
                ['Profit', 'Rp31,7jt', '+9%'],
                ['Fees', 'Rp12,4jt', '-3%'],
              ].map(([label, value, delta]) => (
                <div
                  key={label}
                  className="rounded-md border border-white/10 bg-white/[0.06] p-4"
                >
                  <p className="text-xs font-bold text-white/45">
                    {label}
                  </p>
                  <p className="mt-3 text-2xl font-black text-white">
                    {value}
                  </p>
                  <p className="mt-2 text-xs font-black text-[#00d085]">
                    {delta}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-md border border-white/10 bg-white/[0.06] p-4">
                <div className="mb-6 flex items-center justify-between">
                  <p className="font-black text-white">
                    Margin trend
                  </p>
                  <LineChart className="size-5 text-[#00b3d0]" />
                </div>
                <div className="flex h-44 items-end gap-2">
                  {[
                    35, 48, 44, 62, 58, 76, 68, 86, 80, 92,
                  ].map((height, index) => (
                    <div
                      key={`${height}-${index}`}
                      className="flex-1 rounded-t-sm bg-[#00b3d0]"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.06] p-4">
                <p className="font-black text-white">
                  Recommendation
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    [
                      'Naikkan harga SKU A',
                      'Margin hanya 8,2%',
                    ],
                    [
                      'Push bundle B+C',
                      'Profit per order +31%',
                    ],
                    [
                      'Cek diskon toko',
                      'Voucher makan Rp4,8jt',
                    ],
                  ].map(([title, note]) => (
                    <div
                      key={title}
                      className="rounded-md bg-[#f5f3eb] p-3 text-[#161613]"
                    >
                      <p className="text-sm font-black">
                        {title}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[#5d5a50]">
                        {note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-md border border-white/10 bg-white/[0.06] p-4">
              <div className="mb-3 grid grid-cols-[1.3fr_0.7fr_0.7fr] gap-3 text-xs font-black text-white/40 uppercase">
                <span>Product</span>
                <span>COGS</span>
                <span>Profit</span>
              </div>
              {[
                [
                  'Serum Retinol 20ml',
                  'Rp42.000',
                  'Rp8,8jt',
                ],
                [
                  'Paket Bundling Glow',
                  'Rp91.000',
                  'Rp12,1jt',
                ],
                [
                  'Toner Travel Size',
                  'Rp18.000',
                  'Rp1,4jt',
                ],
              ].map(([product, cogs, profit]) => (
                <div
                  key={product}
                  className="grid grid-cols-[1.3fr_0.7fr_0.7fr] gap-3 border-t border-white/10 py-3 text-sm"
                >
                  <span className="font-bold text-white">
                    {product}
                  </span>
                  <span className="text-white/65">
                    {cogs}
                  </span>
                  <span className="font-black text-[#00d085]">
                    {profit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightBoard() {
  return (
    <div className="rounded-md border-2 border-[#161613] bg-[#f5f3eb] p-4 shadow-[8px_8px_0_#161613]">
      <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-md bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-md bg-[#00b3d0] text-white">
              <Layers3 className="size-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#6b6659]">
                Product snapshot
              </p>
              <p className="text-xl font-black">
                HPP terkunci per periode
              </p>
            </div>
          </div>
          <div className="mt-7 space-y-3">
            {[
              ['COGS filled', '87%'],
              ['Profit-ready SKU', '142'],
              ['Need review', '21'],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-md bg-[#f5f3eb] px-4 py-3"
              >
                <span className="font-bold text-[#5d5a50]">
                  {label}
                </span>
                <span className="font-black">{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-md bg-[#161613] p-5 text-white">
          <div className="flex items-center justify-between">
            <p className="text-xl font-black">
              Profit leaks
            </p>
            <ShieldCheck className="size-6 text-[#00d085]" />
          </div>
          <div className="mt-6 space-y-4">
            {[
              ['Marketplace fee', 'Rp8,2jt', 'Normal'],
              ['Voucher seller', 'Rp4,8jt', 'Review'],
              ['Flash sale SKU C', '-Rp640rb', 'Stop'],
            ].map(([label, value, status]) => (
              <div
                key={label}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-md border border-white/10 p-3"
              >
                <span className="font-bold text-white/75">
                  {label}
                </span>
                <span className="font-black">{value}</span>
                <span className="rounded-sm bg-white px-2 py-1 text-xs font-black text-[#161613]">
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
