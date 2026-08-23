import { OrderPlatform } from '@/constant/order-platform';

export const unwindItems = (
  preserveNullAndEmptyArrays?: boolean
) => {
  return {
    $unwind: {
      path: '$items',
      preserveNullAndEmptyArrays:
        preserveNullAndEmptyArrays ?? false,
    },
  };
};
