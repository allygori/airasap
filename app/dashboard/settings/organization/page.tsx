import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth/auth';
import { OrganizationForm } from './_components/organization-form';

export default async function SettingsOrganizationPage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    redirect('/login');
  }

  if (!session.session.activeOrganizationId) {
    redirect('/onboarding');
  }

  const organization = await auth.api.getFullOrganization({
    headers: requestHeaders,
    query: { membersLimit: 0 },
  });

  if (!organization) {
    redirect('/onboarding');
  }

  return (
    <OrganizationForm initialName={organization.name} />
  );
}
