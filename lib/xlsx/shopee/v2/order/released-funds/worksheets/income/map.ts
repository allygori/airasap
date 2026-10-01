import { toTrimmedString } from '@/lib/string';
import { parseIndonesianNumber } from '@/lib/number';
import { parseExcelDate } from '@/lib/date';

export type FieldConfig = {
  header: string;
  parser: (val: unknown) => string | number | Date | null;
  columnIndex?: number;
};

export const INCOME_FIELD_MAP = {
  number: {
    header: 'No.',
    parser: parseIndonesianNumber,
  },
  rowType: {
    header: 'Lihat berdasarkan',
    parser: toTrimmedString,
  },
  orderId: {
    header: 'No. Pesanan',
    parser: toTrimmedString,
  },
  noSubmission: {
    header: 'No. Pengajuan',
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
  orderCreationDate: {
    header: 'Waktu Pesanan Dibuat',
    parser: parseExcelDate('yyyy-MM-dd'),
  },
  releasedFundDate: {
    header: 'Tanggal Dana Dilepaskan',
    parser: parseExcelDate('yyyy-MM-dd'),
  },
  releasedFundMethod: {
    header: 'Metode Pelepasan Dana',
    parser: toTrimmedString,
  },
  orderType: {
    header: 'Tipe Pesanan',
    parser: toTrimmedString,
  },
  releasedFundsAmount: {
    header: 'Total Penghasilan',
    parser: parseIndonesianNumber,
  },
  productPrice: {
    header: 'Harga Produk',
    parser: parseIndonesianNumber,
  },
  refundToBuyer: {
    header: 'Jumlah Pengembalian Dana ke Pembeli',
    parser: parseIndonesianNumber,
  },
  shippingCostPaidByBuyer: {
    header: 'Ongkir Dibayar Pembeli',
    parser: parseIndonesianNumber,
  },
  shippingCostForwardedByShopee: {
    header: 'Ongkos Kirim yang Dibayarkan ke Jasa Kirim',
    parser: parseIndonesianNumber,
  },
  shippingCostDiscountFromLogistics: {
    header: 'Potongan Ongkos Kirim dari Jasa Kirim',
    parser: parseIndonesianNumber,
  },
  freeShippingFromShopee: {
    header: 'Gratis Ongkir dari Shopee',
    parser: parseIndonesianNumber,
  },
  returnShippingFee: {
    header: 'Ongkos Kirim Pengembalian Barang',
    parser: parseIndonesianNumber,
  },
  returnToSellerFee: {
    header: 'Return to Seller Fee',
    parser: parseIndonesianNumber,
  },
  shippingFeeRefund: {
    header: 'Pengembalian Biaya Kirim',
    parser: parseIndonesianNumber,
  },
  sellerSponsoredVoucher: {
    header: 'Voucher disponsor oleh Penjual',
    parser: parseIndonesianNumber,
  },
  sellerSponsoredCoinCashback: {
    header: 'Cashback Koin disponsori Penjual',
    parser: parseIndonesianNumber,
  },
  productDiscountFromShopee: {
    header: 'Diskon Produk dari Shopee',
    parser: parseIndonesianNumber,
  },
  sellerSponsoredCoFundVoucher: {
    header: 'Voucher co-fund disponsor oleh Penjual',
    parser: parseIndonesianNumber,
  },
  sellerSponsoredCoFundCoinCashback: {
    header: 'Cashback Koin Co-fund disponsori Penjual',
    parser: parseIndonesianNumber,
  },
  adminFee: {
    header: 'Biaya Administrasi',
    parser: parseIndonesianNumber,
  },
  orderProcessingFee: {
    header: 'Biaya Proses Pesanan',
    parser: parseIndonesianNumber,
  },
  GOXFee: {
    header: 'Gratis Ongkir XTRA',
    parser: parseIndonesianNumber,
  },
  AMSServiceFee: {
    header: 'AMS Service Fee',
    parser: parseIndonesianNumber,
  },
  campaignFee: {
    header: 'Biaya Kampanye',
    parser: parseIndonesianNumber,
  },
  AMSCommissionFee: {
    header: 'Biaya Komisi AMS',
    parser: parseIndonesianNumber,
  },
  autoTopUpFeeFromIncome: {
    header: 'Biaya Isi Saldo Otomatis (dari Penghasilan)',
    parser: parseIndonesianNumber,
  },
  otherFee: {
    header: 'Biaya Lainnya',
    parser: parseIndonesianNumber,
  },
  transactionFee: {
    header: 'Biaya Transaksi',
    parser: parseIndonesianNumber,
  },
  fbsFee: {
    header: 'FBS Fee',
    parser: parseIndonesianNumber,
  },
  taxPPH22: {
    header: 'PPh 22',
    parser: parseIndonesianNumber,
  },
  username: {
    header: 'Username (Pembeli)',
    parser: toTrimmedString,
  },
  buyerPayment: {
    header: 'Jumlah Dibayar Pembeli',
    parser: parseIndonesianNumber,
  },
  paymentMethod: {
    header: 'Metode pembayaran pembeli',
    parser: toTrimmedString,
  },
  paymentMethodDetail: {
    header: 'Rincian Metode Pembayaran',
    parser: toTrimmedString,
  },
  installmentPlan: {
    header: 'Rencana Cicilan (jika berlaku)',
    parser: toTrimmedString,
  },
  freeShippingPromoFromSeller: {
    header: 'Promo Gratis Ongkir dari Penjual',
    parser: parseIndonesianNumber,
  },
  shippingService: {
    header: 'Jasa Kirim',
    parser: toTrimmedString,
  },
  shippingServiceName: {
    header: 'Nama Kurir',
    parser: toTrimmedString,
  },
  voucherCode: {
    header: 'Kode Voucher',
    parser: toTrimmedString,
  },
  compensation: {
    header: 'Kompensasi',
    parser: parseIndonesianNumber,
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
