import { OrderPlatform } from '@/constant/order-platform';

export const platformFilter = (platform: OrderPlatform) => {
  return {
    $match: {
      platform: platform,
    },
  };
};
