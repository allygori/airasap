import { betterAuth } from 'better-auth';
import { organization } from 'better-auth/plugins';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { admin } from 'better-auth/plugins';
import { MongoClient } from 'mongodb';
// import { StoreService } from '@/modules/stores/store.service';
// import { CreateStoreDTO } from '@/modules/stores/store.dto';
// import { PLATFORMS } from '../db/constant';
// import { PLATFORMS_KV } from '@/modules/constant';

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
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: true,
  },
  plugins: [
    organization({
      organizationHooks: {
        afterCreateOrganization: async ({
          organization,
          member,
          user,
        }) => {
          // Run custom logic after organization is created
          // e.g., create default resources, send notifications
          // await setupDefaultResources(organization.id);
          // create store and update session
          // try {
          //   const validatedBody = {
          //     organization: organization.id,
          //     name: organization.name,
          //     platform: PLATFORMS_KV.shopee,
          //   };
          //   const storeService = new StoreService({
          //     organizationId: organization.id,
          //   });
          //   const body = validatedBody as CreateStoreDTO;
          //   const newStore =
          //     await storeService.create(body);
          //   //   await auth.api.updateSession({
          //   //   body: {
          //   //     store: 'dark',
          //   //   },
          //   //   // headers: await headers(), // headers containing the user's session token
          //   // });
          // } catch (err) {
          //   console.error(
          //     `[afterCreateOrganization] Gagal membuat toko: ${organization.name}`
          //   );
          // }
        },
      },
    }),
    admin(),
  ],
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
  user: {
    modelName: 'users',
    additionalFields: {
      timezone: {
        type: 'string',
        required: false,
        defaultValue: 'Asia/Jakarta',
      },
      lang: {
        type: 'string',
        required: false,
        defaultValue: 'id',
      },
      // activeStoreId: {
      //   type: 'string',
      //   required: true,
      //   input: false,
      // },
    },
  },
  // docs: https://better-auth.com/docs/concepts/session-management
  session: {
    modelName: 'sessions',
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    // updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
    deferSessionRefresh: true,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds (5 minutes)
      // strategy: "jwe",
    },
    additionalFields: {
      theme: { type: 'string', required: false },
      language: { type: 'string', required: false },
      activeStoreId: {
        type: 'string',
        required: true,
      },
    },
  },
  organization: {
    modelName: 'organizations',
  },
  member: {
    modelName: 'members',
  },
  account: {
    modelName: 'accounts',
  },
  advanced: {
    database: {
      generateId: false,
    },
  },
});

type Session = typeof auth.$Infer.Session;
