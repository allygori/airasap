import {
  stringParser,
  numberParser,
  dateParser,
} from '@/lib/utils/parser';

export type FieldConfig = {
  header?: string;
  columnIndex?: number;
  parser: (val: unknown) => any;
};

export const INCOME_FIELD_MAP = {
  number: {
    header: 'No.',
    parser: numberParser,
  },
  orderId: {
    header: 'No. Pesanan',
    parser: stringParser,
  },
  noSubmission: {
    header: 'No. Pengajuan',
    parser: stringParser,
  },
  buyerUsername: {
    header: 'Username (Pembeli)',
    parser: stringParser,
  },
  orderCreationTime: {
    header: 'Waktu Pesanan Dibuat',
    parser: dateParser('yyyy-MM-dd HH:mm'),
  },
  buyerPaymentMethod: {
    header: 'Metode pembayaran pembeli',
    parser: stringParser,
  },
  releasedFundDate: {
    header: 'Tanggal Dana Dilepaskan',
    parser: dateParser('yyyy-MM-dd HH:mm'),
  },
  originalProductPrice: {
    header: 'Harga Asli Produk',
    parser: numberParser,
  },
  totalProductDiscount: {
    header: 'Total Diskon Produk',
    parser: numberParser,
  },
  buyerRefundAmount: {
    header: 'Jumlah Pengembalian Dana ke Pembeli',
    parser: numberParser,
  },
  productDiscountFromShopee: {
    header: 'Diskon Produk dari Shopee',
    parser: numberParser,
  },
  sellerSponsoredVoucher: {
    header: 'Voucher disponsor oleh Penjual',
    parser: numberParser,
  },
  sellerSponsoredCoFundVoucher: {
    header: 'Voucher co-fund disponsor oleh Penjual',
    parser: numberParser,
  },
  sellerSponsoredCoinCashback: {
    header: 'Cashback Koin disponsori Penjual',
    parser: numberParser,
  },
  sellerSponsoredCoFundCoinCashback: {
    header: 'Cashback Koin Co-fund disponsori Penjual',
    parser: numberParser,
  },
  shippingCostPaidByBuyer: {
    header: 'Ongkir Dibayar Pembeli',
    parser: numberParser,
  },
  shippingCostDiscountByLogistics: {
    header: 'Diskon Ongkir Ditanggung Jasa Kirim',
    parser: numberParser,
  },
  freeShippingFromShopee: {
    header: 'Gratis Ongkir dari Shopee',
    parser: numberParser,
  },
  shippingCostForwardedByShopee: {
    header:
      'Ongkir yang Diteruskan oleh Shopee ke Jasa Kirim',
    parser: numberParser,
  },
  returnShippingFee: {
    header: 'Ongkos Kirim Pengembalian Barang',
    parser: numberParser,
  },
  returnToSenderShippingFee: {
    header: 'Kembali ke Biaya Pengiriman Pengirim',
    parser: numberParser,
  },
  shippingFeeRefund: {
    header: 'Pengembalian Biaya Kirim',
    parser: numberParser,
  },
  amsCommissionFee: {
    header: 'Biaya Komisi AMS',
    parser: numberParser,
  },
  adminFee: {
    header: 'Biaya Administrasi',
    parser: numberParser,
  },
  serviceFee: {
    header: 'Biaya Layanan',
    parser: numberParser,
  },
  orderProcessingFee: {
    header: 'Biaya Proses Pesanan',
    parser: numberParser,
  },
  premium: {
    header: 'Premi',
    parser: numberParser,
  },
  shippingSaverProgramFee: {
    header: 'Biaya Program Hemat Biaya Kirim',
    parser: numberParser,
  },
  transactionFee: {
    header: 'Biaya Transaksi',
    parser: numberParser,
  },
  campaignFee: {
    header: 'Biaya Kampanye',
    parser: numberParser,
  },
  importDutyVatIncomeTax: {
    header: 'Bea Masuk, PPN & PPh',
    parser: numberParser,
  },
  autoTopUpFeeFromIncome: {
    header: 'Biaya Isi Saldo Otomatis (dari Penghasilan)',
    parser: numberParser,
  },
  totalIncome: {
    header: 'Total Penghasilan',
    parser: numberParser,
  },
  voucherCode: {
    header: 'Kode Voucher',
    parser: stringParser,
  },
  compensation: {
    header: 'Kompensasi',
    parser: numberParser,
  },
  freeShippingPromoFromSeller: {
    header: 'Promo Gratis Ongkir dari Penjual',
    parser: numberParser,
  },
  shippingService: {
    header: 'Jasa Kirim',
    parser: stringParser,
  },
  courierName: {
    header: 'Nama Kurir',
    parser: stringParser,
  },
  buyerRefund: {
    header: 'Pengembalian Dana ke Pembeli',
    parser: numberParser,
  },
  proRatedRedeemedCoinForReturn: {
    header:
      'Pro-rata Koin yang Ditukarkan untuk Pengembalian Barang',
    parser: numberParser,
  },
  proRatedShopeeVoucherForReturn: {
    header:
      'Pro-rata Voucher Shopee untuk Pengembalian Barang',
    parser: numberParser,
  },
  proRatedBankPaymentPromotionForReturn: {
    header:
      'Pro-rated Bank Payment Channel Promotion for return refund Items',
    parser: numberParser,
  },
  proRatedShopeePaymentPromotionForReturn: {
    header:
      'Pro-rated Shopee Payment Channel Promotion  for return refund Items',
    parser: numberParser,
  },
} satisfies Record<string, FieldConfig>;

export const SELLER_FEE_FIELD_MAP = {
  number: {
    header: 'No.',
    parser: numberParser,
  },
  rowType: {
    columnIndex: 1,
    parser: stringParser,
  },
  orderId: {
    header: 'No. Pesanan',
    parser: stringParser,
  },
  productId: {
    header: 'ID Produk',
    parser: stringParser,
  },
  productName: {
    header: 'Nama Produk',
    parser: stringParser,
  },
  orderProcessingFee: {
    header: 'Biaya Proses Pesanan',
    parser: numberParser,
  },
} satisfies Record<string, FieldConfig>;

// export type IncomeFieldKey = keyof typeof INCOME_FIELD_MAP;
// export type SellerFeeFieldKey =
//   keyof typeof SELLER_FEE_FIELD_MAP;
