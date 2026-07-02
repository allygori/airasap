import { PLATFORMS_KV_WITH_LABEL } from '../../../../../constant';

export type TPlatform =
  (typeof PLATFORMS_KV_WITH_LABEL)[keyof typeof PLATFORMS_KV_WITH_LABEL]['value'];

export const platformFilter = (platform: TPlatform) => {
  return {
    $match: {
      platform: platform,
    },
  };
};
