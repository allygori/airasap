import { betterAuth } from 'better-auth';
import { organization } from 'better-auth/plugins';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { admin } from 'better-auth/plugins';
import { MongoClient } from 'mongodb';
import { configs } from './configs';
import { databaseHooks } from './hooks';
import { store } from './plugins/store';
import { accountConfig } from './configs/account';
import { userConfig } from './configs/user';
import { sessionConfig } from './configs/session';
import { verificationConfig } from './configs/verification';
// import { StoreService } from '@/modules/stores/store.service';
// import { CreateStoreDTO } from '@/modules/stores/store.dto';

// Ensure your Mongoose connection is established first
const client = new MongoClient(process.env.MONGODB_URI!);
await client.connect();
const db = client.db();

export const auth = betterAuth({
  appName: process.env.NEXT_PUBLIC_APP_NAME || '',
  // database: mongodbAdapter(client),
  database: mongodbAdapter(db, {
    // client,
    // transaction: false // Disable if Replica Set is not available
  }), // Pass both db and client for session stability
  baseURL:
    process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  basePath: '/api/auth',
  secret: process.env.BETTER_AUTH_SECRET,
  logger: {
    disabled: false,
    level: 'debug',
    extendedOnError: true, // Appends full trace to errors
  },
  experimental: {
    joins: false,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: true,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      mapProfileToUser: (profile) => {
        return {
          firstName: profile.given_name,
          lastName: profile.family_name,
        };
      },
    },
  },
  // user: {
  //   modelName: 'users',
  //   additionalFields: {
  //     timezone: {
  //       type: 'string',
  //       required: false,
  //       defaultValue: 'Asia/Jakarta',
  //     },
  //     lang: {
  //       type: 'string',
  //       required: false,
  //       defaultValue: 'id',
  //     },
  //     // activeStoreId: {
  //     //   type: 'string',
  //     //   required: true,
  //     //   input: false,
  //     // },
  //   },
  // },
  // docs: https://better-auth.com/docs/concepts/session-management
  // session: {
  //   modelName: 'sessions',
  //   fields: {
  //     activeOrganizationId: 'active_organization',
  //     userId: 'user',
  //     expiresAt: 'expires_at',
  //     ipAddress: 'ip_address',
  //     userAgent: 'user_agent',
  //     createdAt: 'created_at',
  //     updatedAt: 'updated_at',
  //   },
  //   expiresIn: 60 * 60 * 24 * 7, // 7 days
  //   // updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
  //   deferSessionRefresh: true,
  //   cookieCache: {
  //     enabled: true,
  //     maxAge: 5 * 60, // Cache duration in seconds (5 minutes)
  //     // strategy: "jwe",
  //   },
  //   additionalFields: {
  //     theme: { type: 'string', required: false },
  //     language: { type: 'string', required: false },
  //     activeStoreId: {
  //       type: 'string',
  //       required: true,
  //       fieldName: 'active_store',
  //     },
  //     // active_store: {
  //     //   type: 'string',
  //     //   required: true,
  //     // },
  //   },
  // },
  // organization: {
  //   modelName: 'organizations',
  // },
  // member: {
  //   modelName: 'members',
  // },
  // account: {
  //   modelName: 'accounts',
  //   accountLinking
  // },

  advanced: {
    database: {
      generateId: false,
    },
  },
  // ...configs,
  user: userConfig,
  session: sessionConfig,
  account: accountConfig,
  verification: verificationConfig,

  // databaseHooks,
  // plugins: [
  //   organization({
  //     // 1. Plan for error when mapping fields to snake_case,
  //     // create store client plugin to set active organization id
  //     schema: {
  //       organization: {
  //         modelName: 'organizations',
  //         fields: {
  //           // id: '_id', // REMOVE
  //           createdAt: 'created_at',
  //         },
  //       },
  //       member: {
  //         modelName: 'members',
  //         fields: {
  //           // id: '_id', // REMOVE
  //           // organizationId: 'organization', // REMOVE
  //           organizationId: 'organization_id', // RENAME TO
  //           // userId: 'user', // REMOVE
  //           userId: 'user_id', // RENAME TO
  //           createdAt: 'created_at',
  //           updatedAt: 'updated_at',
  //         },
  //       },
  //       session: {
  //         fields: {
  //           // id: '_id',
  //           // activeOrganizationId: 'active_organization', // REMOVE
  //           activeOrganizationId: 'active_organization_id', // RENAME TO
  //         },
  //       },
  //     },
  //   }),
  //   admin(),
  //   store(),
  // ],
});

// type Session = typeof auth.$Infer.Session;
