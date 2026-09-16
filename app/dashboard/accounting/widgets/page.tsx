import Link from 'next/link';
import {
  ArrowRight,
  Banknote,
  Boxes,
  FilePenLine,
  PackagePlus,
  ReceiptText,
  WalletCards,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type WidgetCardProps = {
  title: string;
  description: string;
  href: string;
  icon: typeof FilePenLine;
  action: string;
};

const widgets: Array<{
  group: string;
  items: WidgetCardProps[];
}> = [
  {
    group: 'Jurnal & ekuitas',
    items: [
      {
        title: 'Manual journal',
        description:
          'Catat transaksi double-entry yang belum memiliki workflow khusus.',
        href: '/dashboard/accounting/journal-entries/create',
        icon: FilePenLine,
        action: 'Buat journal',
      },
      {
        title: 'Setoran modal',
        description:
          'Gunakan manual journal dengan debit kas/bank dan credit modal pemilik.',
        href: '/dashboard/accounting/journal-entries/create?template=capital-contribution',
        icon: Banknote,
        action: 'Catat setoran',
      },
      {
        title: 'Penarikan pemilik',
        description:
          'Gunakan akun prive/distribusi, bukan akun beban operasional.',
        href: '/dashboard/accounting/journal-entries/create?template=owner-distribution',
        icon: WalletCards,
        action: 'Catat penarikan',
      },
    ],
  },
  {
    group: 'Operasional',
    items: [
      {
        title: 'Expense & bahan packing',
        description:
          'Catat biaya toko seperti bubble wrap, lakban, polymailer, dan kardus.',
        href: '/dashboard/accounting',
        icon: ReceiptText,
        action: 'Buka Finance Desk',
      },
      {
        title: 'Pembelian inventory',
        description:
          'Tambah stok dan catat offset kas, bank, atau utang usaha.',
        href: '/dashboard/accounting',
        icon: PackagePlus,
        action: 'Buka Finance Desk',
      },
      {
        title: 'Konsumsi packaging',
        description:
          'Kurangi stok packaging dan hitung biaya pemakaian melalui movement.',
        href: '/dashboard/accounting',
        icon: Boxes,
        action: 'Buka Finance Desk',
      },
    ],
  },
];

export default function AccountingWidgetsPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div>
          <h2 className="mb-1 text-xl font-semibold">
            Accounting widgets
          </h2>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Pilih workflow berdasarkan jenis transaksi.
            Semua widget berakhir di journal posting service
            dan General Ledger turunan.
          </p>
        </div>
        {widgets.map((section) => (
          <section
            key={section.group}
            className="flex flex-col gap-3"
          >
            <h3 className="text-sm font-semibold tracking-wide uppercase">
              {section.group}
            </h3>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {section.items.map((widget) => {
                const Icon = widget.icon;
                return (
                  <Card
                    key={widget.title}
                    className="flex flex-col"
                  >
                    <CardHeader>
                      <div className="bg-primary/10 text-primary mb-2 grid size-10 place-items-center rounded-xl">
                        <Icon />
                      </div>
                      <CardTitle className="text-base">
                        {widget.title}
                      </CardTitle>
                      <CardDescription>
                        {widget.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto">
                      <Link
                        href={widget.href}
                        className={buttonVariants({
                          variant: 'outline',
                          className:
                            'w-full justify-between',
                        })}
                      >
                        {widget.action}
                        <ArrowRight data-icon="inline-end" />
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
