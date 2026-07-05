export const PLATFORMS = [
  'shopee',
  'tokopedia',
  'tiktok-shop',
  'lazada',
  'blibli',
];

export const PLATFORMS_KV = {
  shopee: 'shopee',
  tokopedia: 'tokopedia',
  tiktok: 'tiktok-shop',
  lazada: 'lazada',
  blibli: 'blibli',
};

export const PLATFORMS_KV_WITH_LABEL = {
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

export const SHOPEE_PAYMENT_METHODS = [
  'ShopeePay',
  'Kartu Kredit/Debit',
  'SPayLater',
  'SeaBank Bayar Instan',
  'QRIS',
  'Online Payment', // Transfer Bank/Virtual Account
  'Pembayaran dibebaskan',
  'Mitra Shopee',
  'COD', // Cash on Delivery
  'BRI Direct Debit',
  'OneKlik',
  'Cicilan Kartu Kredit',
  'Agen BRILink',
  'BNI Agen46',
  'Alfamart',
  'Indomaret',
];

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
  return: {
    label: 'Pengembalian',
    value: 'pengembalian',
  },
  refund: {
    label: 'Pengembalian Dana',
    value: 'pengembalian-dana',
  },
} as const;
