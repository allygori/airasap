import { authClient } from '@/lib/auth/auth-client'; // Better Auth client hook reference

export async function tenantFetch(
  url: string,
  options: RequestInit = {}
) {
  // Extract the client-side state computed by Better Auth's plugin
  const { data: session } = authClient.useSession();
  const activeOrgId = session?.session.activeOrganizationId;

  const headers = new Headers(options.headers);
  if (activeOrgId) {
    headers.set('x-organization-id', activeOrgId);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
