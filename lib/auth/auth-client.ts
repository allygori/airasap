import { createAuthClient } from 'better-auth/react';
import {
  inferOrgAdditionalFields,
  organizationClient,
} from 'better-auth/client/plugins';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import type { auth } from './auth';
import { storeClient } from './plugins/store';

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  // baseURL: "http://localhost:3000"
  plugins: [
    organizationClient({
      // schema: {
      //   organization: {
      //   },
      //   member: {
      //   },
      // }
      schema: inferOrgAdditionalFields<typeof auth>(),
    }),
    inferAdditionalFields<typeof auth>(),
    storeClient(),
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

// const test = authClient.organization.setActive

export const {
  signIn,
  signUp,
  useSession,
  getSession,
  updateSession,
} = createAuthClient();
