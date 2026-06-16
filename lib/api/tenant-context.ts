import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';

export const getTenantContext = async () => {
  const session = await auth.api.getSession({
    headers: await headers(), // Forward Next.js headers to Better Auth
  });

  return {
    organizationId:
      session?.session?.activeOrganizationId || '',
    storeId: session?.session?.activeStoreId || '',
    userId: session?.session?.userId || '',
  };
};
