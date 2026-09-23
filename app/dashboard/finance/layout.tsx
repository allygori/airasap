import type { ReactNode } from 'react';
import Link from 'next/link';
import { getTenantContext } from '@/lib/api/tenant-context';
import { db } from '@/lib/db/connection';
import { FinanceEntitlementService } from '@/modules/finance';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';

export default async function FinanceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const tenantContext = await getTenantContext();

  if (!tenantContext.organizationId) {
    return <FinanceUnavailable />;
  }

  await db.connect();
  const access = await new FinanceEntitlementService(
    tenantContext
  ).getAvailability();

  if (!access.available) {
    return <FinancePremiumRequired />;
  }

  return children;
}

function FinanceUnavailable() {
  return (
    <GateCard
      title="Finance tidak tersedia"
      description="Pilih organisasi terlebih dahulu untuk membuka modul Finance."
    />
  );
}

function FinancePremiumRequired() {
  return (
    <GateCard
      title="Finance adalah fitur premium"
      description="Modul Finance tersedia pada paket premium. Data keuangan tidak dapat dibuka atau diposting sebelum organisasi memiliki akses."
    />
  );
}

function GateCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="@container/main flex flex-1 items-start p-4 md:p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/dashboard"
            className={buttonVariants({
              variant: 'outline',
            })}
          >
            Kembali ke dashboard
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
