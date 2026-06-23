import { BetterAuthOptions } from 'better-auth';

export const accountConfig = {
  modelName: 'accounts',
  fields: {
    // accountId: 'account',
    accountId: '_id',
    userId: 'user',
    providerId: 'provider',
    password: 'password',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  additionalFields: {
    deleted_at: {
      type: 'date',
      required: false,
    },
  },
} satisfies BetterAuthOptions['account'];
