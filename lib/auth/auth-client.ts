import { createAuthClient } from 'better-auth/react';
import { organizationClient } from 'better-auth/client/plugins';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import type { auth } from './auth';

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  // baseURL: "http://localhost:3000"
  plugins: [
    organizationClient(),
    inferAdditionalFields<typeof auth>(),
    // inferAdditionalFields({
    //   session: {
    //     theme: {
    //       type: 'string',
    //     },
    //     language: {
    //       type: 'string',
    //     },
    //     activeStoreId: {
    //       type: 'string',
    //     },
    //   },
    // }),
  ],
});

export type Session = typeof authClient.$Infer.Session;

export const {
  signIn,
  signUp,
  useSession,
  getSession,
  updateSession,
} = createAuthClient();
