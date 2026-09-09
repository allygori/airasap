import {
  stringParser,
  numberParser,
  dateParser,
} from '@/lib/utils/parser';

export type FieldConfig = {
  header: string;
  parser: (val: unknown) => string | number | Date | null;
  columnIndex?: number;
};

export const INCOME_FIELD_MAP = {
  number: {
    header: 'No.',
    parser: numberParser,
  },
  rowType: {
    header: 'Lihat berdasarkan',
    parser: stringParser,
  },
  orderId: {
    header: 'No. Pesanan',
    parser: stringParser,
  },
  noSubmission: {
    header: 'No. Pengajuan',
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
  orderCreationDate: {
    header: 'Waktu Pesanan Dibuat',
    parser: dateParser('yyyy-MM-dd'),
  },
  releasedFundDate: {
    header: 'Tanggal Dana Dilepaskan',
    parser: dateParser('yyyy-MM-dd'),
  },
  releasedFundMethod: {
    header: 'Metode Pelepasan Dana',
    parser: stringParser,
  },
  orderType: {
    header: 'Tipe Pesanan',
    parser: stringParser,
  },
  releasedFundsAmount: {
    header: 'Total Penghasilan',
    parser: numberParser,
  },
  productPrice: {
    header: 'Harga Produk',
    parser: numberParser,
  },
  refundToBuyer: {
    header: 'Jumlah Pengembalian Dana ke Pembeli',
    parser: numberParser,
  },
  shippingCostPaidByBuyer: {
    header: 'Ongkir Dibayar Pembeli',
    parser: numberParser,
  },
  shippingCostForwardedByShopee: {
    header: 'Ongkos Kirim yang Dibayarkan ke Jasa Kirim',
    parser: numberParser,
  },
  shippingCostDiscountFromLogistics: {
    header: 'Potongan Ongkos Kirim dari Jasa Kirim',
    parser: numberParser,
  },
  freeShippingFromShopee: {
    header: 'Gratis Ongkir dari Shopee',
    parser: numberParser,
  },
  returnShippingFee: {
    header: 'Ongkos Kirim Pengembalian Barang',
    parser: numberParser,
  },
  returnToSellerFee: {
    header: 'Return to Seller Fee',
    parser: numberParser,
  },
  shippingFeeRefund: {
    header: 'Pengembalian Biaya Kirim',
    parser: numberParser,
  },
  sellerSponsoredVoucher: {
    header: 'Voucher disponsor oleh Penjual',
    parser: numberParser,
  },
  sellerSponsoredCoinCashback: {
    header: 'Cashback Koin disponsori Penjual',
    parser: numberParser,
  },
  productDiscountFromShopee: {
    header: 'Diskon Produk dari Shopee',
    parser: numberParser,
  },
  sellerSponsoredCoFundVoucher: {
    header: 'Voucher co-fund disponsor oleh Penjual',
    parser: numberParser,
  },
  sellerSponsoredCoFundCoinCashback: {
    header: 'Cashback Koin Co-fund disponsori Penjual',
    parser: numberParser,
  },
  adminFee: {
    header: 'Biaya Administrasi',
    parser: numberParser,
  },
  orderProcessingFee: {
    header: 'Biaya Proses Pesanan',
    parser: numberParser,
  },
  GOXFee: {
    header: 'Gratis Ongkir XTRA',
    parser: numberParser,
  },
  AMSServiceFee: {
    header: 'AMS Service Fee',
    parser: numberParser,
  },
  campaignFee: {
    header: 'Biaya Kampanye',
    parser: numberParser,
  },
  AMSCommissionFee: {
    header: 'Biaya Komisi AMS',
    parser: numberParser,
  },
  autoTopUpFeeFromIncome: {
    header: 'Biaya Isi Saldo Otomatis (dari Penghasilan)',
    parser: numberParser,
  },
  otherFee: {
    header: 'Biaya Lainnya',
    parser: numberParser,
  },
  transactionFee: {
    header: 'Biaya Transaksi',
    parser: numberParser,
  },
  fbsFee: {
    header: 'FBS Fee',
    parser: numberParser,
  },
  taxPPH22: {
    header: 'PPh 22',
    parser: numberParser,
  },
  username: {
    header: 'Username (Pembeli)',
    parser: stringParser,
  },
  buyerPayment: {
    header: 'Jumlah Dibayar Pembeli',
    parser: numberParser,
  },
  paymentMethod: {
    header: 'Metode pembayaran pembeli',
    parser: stringParser,
  },
  paymentMethodDetail: {
    header: 'Rincian Metode Pembayaran',
    parser: stringParser,
  },
  installmentPlan: {
    header: 'Rencana Cicilan (jika berlaku)',
    parser: stringParser,
  },
  freeShippingPromoFromSeller: {
    header: 'Promo Gratis Ongkir dari Penjual',
    parser: numberParser,
  },
  shippingService: {
    header: 'Jasa Kirim',
    parser: stringParser,
  },
  shippingServiceName: {
    header: 'Nama Kurir',
    parser: stringParser,
  },
  voucherCode: {
    header: 'Kode Voucher',
    parser: stringParser,
  },
  compensation: {
    header: 'Kompensasi',
    parser: numberParser,
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
