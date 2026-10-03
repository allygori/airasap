import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth/auth';
import { ProfileForm } from './_components/profile-form';

export default async function SettingsProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  return (
    <ProfileForm
      initialName={session.user.name}
      email={session.user.email}
    />
  );
}
