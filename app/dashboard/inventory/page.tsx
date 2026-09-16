'use client';

import Link from 'next/link';
import {
  ArrowRight,
  ArrowLeftRight,
  Boxes,
  MapPin,
  PackageSearch,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';

const sections = [
  {
    href: '/dashboard/inventory/items',
    title: 'Inventory items',
    description:
      'SKU, merchandise, packaging, supplies, dan item yang stock-nya dilacak.',
    icon: PackageSearch,
  },
  {
    href: '/dashboard/inventory/locations',
    title: 'Inventory locations',
    description:
      'Gudang, ruang penyimpanan, dan lokasi logis untuk stock movement.',
    icon: MapPin,
  },
  {
    href: '/dashboard/inventory/mappings',
    title: 'Product mappings',
    description:
      'Hubungkan product/variant dari store dengan inventory item internal.',
    icon: ArrowLeftRight,
  },
  {
    href: '/dashboard/inventory/movements',
    title: 'Inventory movements',
    description:
      'Audit trail quantity dan nilai stok dari seluruh workflow operasional.',
    icon: Boxes,
  },
];

export default function InventoryPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="max-w-3xl space-y-3">
        <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
          Commerce operations
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
          Inventory control center
        </h1>
        <p className="text-muted-foreground text-base leading-7">
          Kelola master item, lokasi fisik, dan jejak
          perubahan stok sebelum inventory dipakai oleh
          accounting dan order integration.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card
              key={section.href}
              className="group hover:border-primary/50 transition-colors"
            >
              <CardHeader>
                <Icon className="text-primary mb-2 size-8" />
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href={section.href}
                  className={buttonVariants({
                    variant: 'outline',
                    className: 'w-full justify-between',
                  })}
                >
                  Buka module
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
