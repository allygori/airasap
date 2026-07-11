import { BetterAuthOptions } from 'better-auth';

export const accountConfig = {
  modelName: 'accounts',
  fields: {
    // accountId: 'account',

    // accountId: '_id', // REMOVE
    userId: 'user_id', // REMOVE
    providerId: 'provider_id',
    accountId: 'account_id', // RENAME TO
    // userId: 'user', // REMOVE
    // password: 'password',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  additionalFields: {
    deletedAt: {
      type: 'date',
      required: false,
      fieldName: 'deleted_at',
    },
  },
} satisfies BetterAuthOptions['account'];
