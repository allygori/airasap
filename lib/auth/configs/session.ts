import { BetterAuthOptions } from 'better-auth';

// docs: https://better-auth.com/docs/concepts/session-management
export const sessionConfig = {
  modelName: 'sessions',
  fields: {
    activeOrganizationId: 'active_organization',
    userId: 'user',
    expiresAt: 'expires_at',
    ipAddress: 'ip_address',
    userAgent: 'user_agent',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
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
      fieldName: 'active_store',
    },
  },
} satisfies BetterAuthOptions['session'] & {
  fields: {
    activeOrganizationId: string;
  };
};
