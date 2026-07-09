export const SHOPEE_ORDER_STATUS = {
  completed: {
    label: 'Selesai',
    value: 'selesai',
  },
  toShip: {
    label: 'Sedang Dikirim',
    value: 'sedang-dikirim',
  },
  toReceive: {
    label: 'Telah Dikirim',
    value: 'telah-dikirim',
  },
  cancelled: {
    label: 'Batal',
    value: 'batal',
  },
  // need fix or make it complete
  return: {
    label: 'Pengembalian',
    value: 'pengembalian',
  },
  refund: {
    label: 'Pengembalian Dana',
    value: 'pengembalian-dana',
  },
} as const;

export const SHOPEE_ORDER_STATUS_VALUES = Object.values(
  SHOPEE_ORDER_STATUS
).map((s) => s.value);

export type ShopeeOrderStatus =
  (typeof SHOPEE_ORDER_STATUS)[keyof typeof SHOPEE_ORDER_STATUS]['value'];
