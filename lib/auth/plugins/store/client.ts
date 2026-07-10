import type { BetterAuthClientPlugin } from 'better-auth/client';
import type { storePlugin } from './server';

export const storePluginClient = () => {
  return {
    id: 'store-client-plugin',
    $InferServerPlugin: {} as ReturnType<
      typeof storePlugin
    >,
    getActions: ($fetch) => ({
      store: {
        setActive: async (body: {
          organizationId: string;
          storeId?: string | null;
        }) => {
          // Fires an internal fetch to your server-side custom endpoint
          return await $fetch<{ success: boolean }>(
            '/store/set-active',
            {
              method: 'POST',
              body,
            }
          );
        },
        setActiveStoreAndOrganization: async (body: {
          organizationId: string;
          storeId?: string | null;
        }) => {
          // Fires an internal fetch to your server-side custom endpoint
          return await $fetch<{ success: boolean }>(
            '/store/set-active-store-and-organization',
            {
              method: 'POST',
              body,
            }
          );
        },
      },
    }),
  } satisfies BetterAuthClientPlugin;
};
