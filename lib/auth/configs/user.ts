import { BetterAuthOptions } from 'better-auth';

export const userConfig = {
  modelName: 'users',
  additionalFields: {
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
