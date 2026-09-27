import Link from 'next/link';
import {
  ArrowLeftRightIcon,
  BookOpen01Icon,
  Chart03Icon,
  InformationCircleIcon,
  PackageAdd01Icon,
  PackageProcess01Icon,
  PackageRemove01Icon,
  ReceiptTextIcon,
  ShoppingCartCheck02Icon,
  Store01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@/components/icons/hugeicons-icon';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { IconSvgObject } from '@/types/icon';

type FinanceWidget = {
  title: string;
  description: string;
  href: string;
  icon: IconSvgObject;
  action: string;
};

type FinanceWidgetGroup = {
  title: string;
  widgets: FinanceWidget[];
};

const widgetGroups: FinanceWidgetGroup[] = [
  {
    title: 'Catat transaksi',
    widgets: [
      {
        title: 'Penjualan marketplace',
        description:
          'Pantau transaksi dari order marketplace yang sudah diproses ke Finance.',
        href: '/dashboard/finance/sales',
        icon: ShoppingCartCheck02Icon,
        action: 'Lihat penjualan',
      },
      {
        title: 'Penjualan offline',
        description:
          'Catat penjualan langsung beserta pembayaran dan pengurangan stok.',
        href: '/dashboard/finance/sales/offline',
        icon: Store01Icon,
        action: 'Buat penjualan',
      },
      {
        title: 'Pembelian merchandise',
        description:
          'Catat stok masuk dan pembayaran tunai, bank, atau utang.',
        href: '/dashboard/finance/purchase',
        icon: PackageAdd01Icon,
        action: 'Catat pembelian',
      },
      {
        title: 'Biaya & pengeluaran',
        description:
          'Catat biaya operasional dengan akun kategori dan sumber pembayaran.',
        href: '/dashboard/finance/expenses-and-outflows',
        icon: ReceiptTextIcon,
        action: 'Catat biaya',
      },
      {
        title: 'Transfer Kas & Bank',
        description:
          'Pindahkan saldo antar akun Kas & Bank melalui transaksi transfer.',
        href: '/dashboard/finance/cash-and-bank-transfers',
        icon: ArrowLeftRightIcon,
        action: 'Buat transfer',
      },
      {
        title: 'Penyesuaian stok',
        description:
          'Koreksi jumlah atau nilai persediaan dengan mutasi dan jurnal terkait.',
        href: '/dashboard/finance/inventory/stock-adjustments',
        icon: PackageRemove01Icon,
        action: 'Sesuaikan stok',
      },
    ],
  },
  {
    title: 'Tinjau & kelola',
    widgets: [
      {
        title: 'Jurnal Umum',
        description:
          'Telusuri jurnal yang dibentuk oleh transaksi Finance beserta status posting-nya.',
        href: '/dashboard/finance/accounting/general-journal',
        icon: BookOpen01Icon,
        action: 'Lihat jurnal',
      },
      {
        title: 'Riwayat mutasi stok',
        description:
          'Periksa pergerakan stok dari pembelian, penjualan, transfer, dan penyesuaian.',
        href: '/dashboard/finance/inventory/movements',
        icon: PackageProcess01Icon,
        action: 'Lihat mutasi',
      },
      {
        title: 'Chart of Accounts',
        description:
          'Tinjau struktur akun organisasi dan akun yang dipakai untuk pencatatan.',
        href: '/dashboard/finance/accounting/chart-of-accounts',
        icon: Chart03Icon,
        action: 'Buka CoA',
      },
    ],
  },
];

export default function FinanceWidgetsPage() {
  return (
    <main className="@container/main flex flex-1 flex-col gap-8 p-4 md:p-6">
      <header className="flex flex-col gap-3">
        <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
          Finance / Akuntansi
        </p>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Widgets Finance
          </h1>
          <p className="text-muted-foreground max-w-3xl text-sm leading-6 md:text-base">
            Pintasan untuk mencatat transaksi dan meninjau
            hasil pembukuan Finance.
          </p>
        </div>
      </header>

      <Alert>
        <HugeiconsIcon icon={InformationCircleIcon} />
        <AlertDescription>
          Jurnal terbentuk dari workflow transaksi Finance.
          Jurnal Umum di sini untuk meninjau; form jurnal
          manual, setoran modal, dan prive belum tersedia di
          Finance baru.
        </AlertDescription>
      </Alert>

      {widgetGroups.map((group) => (
        <section
          key={group.title}
          aria-labelledby={toHeadingId(group.title)}
          className="flex flex-col gap-4"
        >
          <div className="flex items-baseline justify-between gap-4">
            <h2
              id={toHeadingId(group.title)}
              className="text-lg font-semibold tracking-tight"
            >
              {group.title}
            </h2>
            <span className="text-muted-foreground text-xs">
              {group.widgets.length} pintasan
            </span>
          </div>

          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.widgets.map((widget) => (
              <Card
                key={widget.title}
                className="hover:border-primary/30 flex h-full flex-col transition-colors"
              >
                <CardHeader className="gap-3">
                  <div className="bg-primary/10 text-primary grid size-11 place-items-center rounded-xl">
                    <HugeiconsIcon
                      icon={widget.icon}
                      size={22}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <CardTitle className="text-base">
                      {widget.title}
                    </CardTitle>
                    <CardDescription className="leading-6">
                      {widget.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Link
                    href={widget.href}
                    className={buttonVariants({
                      variant: 'outline',
                      className: 'w-full justify-between',
                    })}
                  >
                    {widget.action}
                    <span aria-hidden="true">→</span>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

function toHeadingId(title: string) {
  return title.toLowerCase().replaceAll(' ', '-');
}
