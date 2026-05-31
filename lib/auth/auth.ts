import { betterAuth } from 'better-auth';
import { organization } from 'better-auth/plugins';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { admin } from 'better-auth/plugins';
import { MongoClient } from 'mongodb';

// Ensure your Mongoose connection is established first
const client = new MongoClient(process.env.MONGODB_URI!);
await client.connect();
const db = client.db();

export const auth = betterAuth({
  // database: mongodbAdapter(client),
  database: mongodbAdapter(db, {
    // client,
    // transaction: false // Disable if Replica Set is not available
  }), // Pass both db and client for session stability
  user: {
    modelName: 'users',
  },
  baseURL:
    process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  basePath: '/api/auth',
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  plugins: [organization(), admin()],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
  },

  // docs: https://better-auth.com/docs/concepts/session-management
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
    deferSessionRefresh: true,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },
  },
  advanced: {
    database: {
      generateId: false,
    },
  },
});
