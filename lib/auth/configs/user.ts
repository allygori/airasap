import { BetterAuthOptions } from 'better-auth';

export const userConfig = {
  modelName: 'users',
  // fields: {
  //   emailVerified: 'email_verified',
  //   createdAt: 'created_at',
  //   updatedAt: 'updated_at',
  // },
  additionalFields: {
    is_onboarded: {
      type: 'boolean',
      required: false,
      defaultValue: false,
    },
    timezone: {
      type: 'string',
      required: false,
      defaultValue: 'Asia/Jakarta',
    },
    // lang: {
    //   type: 'string',
    //   required: false,
    //   defaultValue: 'id',
    // },
  },
} satisfies BetterAuthOptions['user'];
