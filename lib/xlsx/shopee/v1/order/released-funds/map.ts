import { toTrimmedString } from '@/lib/string';
import { parseIndonesianNumber } from '@/lib/number';
import { parseExcelDate } from '@/lib/date';

export type FieldConfig = {
  header?: string;
  columnIndex?: number;
  parser: (val: unknown) => any;
};

export const INCOME_FIELD_MAP = {
  number: {
    header: 'No.',
    parser: parseIndonesianNumber,
  },
  orderId: {
    header: 'No. Pesanan',
    parser: toTrimmedString,
  },
  noSubmission: {
    header: 'No. Pengajuan',
    parser: toTrimmedString,
  },
  buyerUsername: {
    header: 'Username (Pembeli)',
    parser: toTrimmedString,
  },
  orderCreationTime: {
    header: 'Waktu Pesanan Dibuat',
    parser: parseExcelDate('yyyy-MM-dd HH:mm'),
  },
  buyerPaymentMethod: {
    header: 'Metode pembayaran pembeli',
    parser: toTrimmedString,
  },
  releasedFundDate: {
    header: 'Tanggal Dana Dilepaskan',
    parser: parseExcelDate('yyyy-MM-dd HH:mm'),
  },
  originalProductPrice: {
    header: 'Harga Asli Produk',
    parser: parseIndonesianNumber,
  },
  totalProductDiscount: {
    header: 'Total Diskon Produk',
    parser: parseIndonesianNumber,
  },
  buyerRefundAmount: {
    header: 'Jumlah Pengembalian Dana ke Pembeli',
    parser: parseIndonesianNumber,
  },
  productDiscountFromShopee: {
    header: 'Diskon Produk dari Shopee',
    parser: parseIndonesianNumber,
  },
  sellerSponsoredVoucher: {
    header: 'Voucher disponsor oleh Penjual',
    parser: parseIndonesianNumber,
  },
  sellerSponsoredCoFundVoucher: {
    header: 'Voucher co-fund disponsor oleh Penjual',
    parser: parseIndonesianNumber,
  },
  sellerSponsoredCoinCashback: {
    header: 'Cashback Koin disponsori Penjual',
    parser: parseIndonesianNumber,
  },
  sellerSponsoredCoFundCoinCashback: {
    header: 'Cashback Koin Co-fund disponsori Penjual',
    parser: parseIndonesianNumber,
  },
  shippingCostPaidByBuyer: {
    header: 'Ongkir Dibayar Pembeli',
    parser: parseIndonesianNumber,
  },
  shippingCostDiscountByLogistics: {
    header: 'Diskon Ongkir Ditanggung Jasa Kirim',
    parser: parseIndonesianNumber,
  },
  freeShippingFromShopee: {
    header: 'Gratis Ongkir dari Shopee',
    parser: parseIndonesianNumber,
  },
  shippingCostForwardedByShopee: {
    header:
      'Ongkir yang Diteruskan oleh Shopee ke Jasa Kirim',
    parser: parseIndonesianNumber,
  },
  returnShippingFee: {
    header: 'Ongkos Kirim Pengembalian Barang',
    parser: parseIndonesianNumber,
  },
  returnToSenderShippingFee: {
    header: 'Kembali ke Biaya Pengiriman Pengirim',
    parser: parseIndonesianNumber,
  },
  shippingFeeRefund: {
    header: 'Pengembalian Biaya Kirim',
    parser: parseIndonesianNumber,
  },
  amsCommissionFee: {
    header: 'Biaya Komisi AMS',
    parser: parseIndonesianNumber,
  },
  adminFee: {
    header: 'Biaya Administrasi',
    parser: parseIndonesianNumber,
  },
  serviceFee: {
    header: 'Biaya Layanan',
    parser: parseIndonesianNumber,
  },
  orderProcessingFee: {
    header: 'Biaya Proses Pesanan',
    parser: parseIndonesianNumber,
  },
  premium: {
    header: 'Premi',
    parser: parseIndonesianNumber,
  },
  shippingSaverProgramFee: {
    header: 'Biaya Program Hemat Biaya Kirim',
    parser: parseIndonesianNumber,
  },
  transactionFee: {
    header: 'Biaya Transaksi',
    parser: parseIndonesianNumber,
  },
  campaignFee: {
    header: 'Biaya Kampanye',
    parser: parseIndonesianNumber,
  },
  importDutyVatIncomeTax: {
    header: 'Bea Masuk, PPN & PPh',
    parser: parseIndonesianNumber,
  },
  autoTopUpFeeFromIncome: {
    header: 'Biaya Isi Saldo Otomatis (dari Penghasilan)',
    parser: parseIndonesianNumber,
  },
  totalIncome: {
    header: 'Total Penghasilan',
    parser: parseIndonesianNumber,
  },
  voucherCode: {
    header: 'Kode Voucher',
    parser: toTrimmedString,
  },
  compensation: {
    header: 'Kompensasi',
    parser: parseIndonesianNumber,
  },
  freeShippingPromoFromSeller: {
    header: 'Promo Gratis Ongkir dari Penjual',
    parser: parseIndonesianNumber,
  },
  shippingService: {
    header: 'Jasa Kirim',
    parser: toTrimmedString,
  },
  courierName: {
    header: 'Nama Kurir',
    parser: toTrimmedString,
  },
  buyerRefund: {
    header: 'Pengembalian Dana ke Pembeli',
    parser: parseIndonesianNumber,
  },
  proRatedRedeemedCoinForReturn: {
    header:
      'Pro-rata Koin yang Ditukarkan untuk Pengembalian Barang',
    parser: parseIndonesianNumber,
  },
  proRatedShopeeVoucherForReturn: {
    header:
      'Pro-rata Voucher Shopee untuk Pengembalian Barang',
    parser: parseIndonesianNumber,
  },
  proRatedBankPaymentPromotionForReturn: {
    header:
      'Pro-rated Bank Payment Channel Promotion for return refund Items',
    parser: parseIndonesianNumber,
  },
  proRatedShopeePaymentPromotionForReturn: {
    header:
      'Pro-rated Shopee Payment Channel Promotion  for return refund Items',
    parser: parseIndonesianNumber,
  },
} satisfies Record<string, FieldConfig>;

export const SELLER_FEE_FIELD_MAP = {
  number: {
    header: 'No.',
    parser: parseIndonesianNumber,
  },
  rowType: {
    columnIndex: 1,
    parser: toTrimmedString,
  },
  orderId: {
    header: 'No. Pesanan',
    parser: toTrimmedString,
  },
  productId: {
    header: 'ID Produk',
    parser: toTrimmedString,
  },
  productName: {
    header: 'Nama Produk',
    parser: toTrimmedString,
  },
  orderProcessingFee: {
    header: 'Biaya Proses Pesanan',
    parser: parseIndonesianNumber,
  },
} satisfies Record<string, FieldConfig>;

// export type IncomeFieldKey = keyof typeof INCOME_FIELD_MAP;
// export type SellerFeeFieldKey =
//   keyof typeof SELLER_FEE_FIELD_MAP;
