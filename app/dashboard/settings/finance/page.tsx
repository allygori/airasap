import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db/connection';
import { FinanceSettingsService } from '@/modules/finance';
import { FinanceSettingsForm } from './_components/finance-settings-form';

export default async function SettingsFinancePage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) redirect('/login');

  const organizationId =
    session.session.activeOrganizationId;
  if (!organizationId) redirect('/onboarding');

  await db.connect();
  const settings = await new FinanceSettingsService({
    organizationId,
    userId: session.user.id,
  }).getSettings();

  return (
    <FinanceSettingsForm
      initialValues={{
        calendar_timezone: settings.calendar_timezone,
      }}
      status={settings.status}
    />
  );
}
