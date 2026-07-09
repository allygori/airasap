export const ORDER_PLATFORMS = {
  shopee: {
    label: 'Shopee',
    value: 'shopee',
  },
  tokopedia: {
    label: 'Tokopedia',
    value: 'tokopedia',
  },
  tiktok: {
    label: 'Tiktok Shop',
    value: 'tiktok-shop',
  },
  lazada: {
    label: 'Lazada',
    value: 'lazada',
  },
  blibli: {
    label: 'Blibli',
    value: 'blibli',
  },
} as const;

export const ORDER_PLATFORM_VALUES = Object.values(
  ORDER_PLATFORMS
).map((p) => p.value);

export type OrderPlatform =
  (typeof ORDER_PLATFORMS)[keyof typeof ORDER_PLATFORMS]['value'];
