import { BetterAuthOptions } from 'better-auth';

export const accountConfig = {
  modelName: 'accounts',
  // fields: {
  //   userId: 'user_id',
  //   providerId: 'provider_id',
  //   accountId: 'account_id',
  //   accessToken: 'access_token',
  //   accessTokenExpiresAt: 'access_token_expires_at',
  //   idToken: 'id_token',
  //   refreshToken: 'refresh_token',
  //   refreshTokenExpiresAt: 'refresh_token_expires_at',
  //   createdAt: 'created_at',
  //   updatedAt: 'updated_at',
  // },
  additionalFields: {
    deletedAt: {
      type: 'date',
      required: false,
      fieldName: 'deleted_at',
    },
  },
} satisfies BetterAuthOptions['account'];
