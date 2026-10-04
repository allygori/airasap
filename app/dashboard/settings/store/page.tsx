import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Store as StoreIcon } from 'lucide-react';

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db/connection';
import {
  TIMEZONES,
  TIMEZONE_VALUES,
} from '@/constant/timezone';
import { StoreService } from '@/modules/stores/store.service';
import { StoreForm } from './_components/store-form';

export default async function SettingsStorePage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    redirect('/login');
  }

  const organizationId =
    session.session.activeOrganizationId;
  const storeId = session.session.activeStoreId;

  if (!organizationId) {
    redirect('/onboarding');
  }

  const organization = await auth.api.getFullOrganization({
    headers: requestHeaders,
    query: { membersLimit: 0 },
    returnStatus: true,
  });

  if (organization.status === 401) {
    redirect('/login');
  }

  if (
    organization.status >= 400 ||
    !organization.response
  ) {
    redirect('/onboarding');
  }

  if (!storeId) {
    return <StoreSettingsUnavailable />;
  }

  await db.connect();
  const store = await new StoreService({
    organizationId,
    storeId,
  }).getCurrentStore();

  if (!store) {
    return <StoreSettingsUnavailable />;
  }

  const timezone = TIMEZONE_VALUES.find(
    (value) => value === store.timezone
  );

  return (
    <StoreForm
      storeId={String(store._id)}
      initialValues={{
        name: store.name,
        code: store.code ?? '',
        timezone: timezone ?? TIMEZONES.WIB.value,
      }}
    />
  );
}

function StoreSettingsUnavailable() {
  return (
    <Empty className="min-h-72 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <StoreIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Toko aktif tidak ditemukan</EmptyTitle>
        <EmptyDescription>
          Pengaturan ini mengikuti toko aktif pada sesi.
          Selesaikan onboarding untuk membuat toko pertama.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          nativeButton={false}
          render={<Link href="/onboarding" />}
        >
          Buka onboarding
        </Button>
      </EmptyContent>
    </Empty>
  );
}
