import {
  stringParser,
  numberParser,
  dateParser,
  booleanParser,
  dateParserToISOString,
} from '@/lib/utils/parser';

export type FieldConfig = {
  header: string;
  parser: (val: unknown) => any;
};

export const ALL_ORDER_FIELD_MAP = {
  id: {
    header: 'No. Pesanan',
    parser: stringParser,
  },
  type: {
    header: 'Tipe Pesanan',
    parser: stringParser,
  },
  status: {
    header: 'Status Pesanan',
    parser: stringParser,
  },
  cancellationReason: {
    header: 'Alasan Pembatalan',
    parser: stringParser,
  },
  cancellationReturnStatus: {
    header: 'Status Pembatalan/ Pengembalian',
    parser: stringParser,
  },
  trackingNumber: {
    header: 'No. Resi',
    parser: stringParser,
  },
  shippingOption: {
    header: 'Opsi Pengiriman',
    parser: stringParser,
  },
  dropOffCounterPickUp: {
    header: 'Antar ke counter/ pick-up',
    parser: stringParser,
  },
  orderMustBeShippedBeforeAvoidLateShipment: {
    header:
      'Pesanan Harus Dikirimkan Sebelum (Menghindari keterlambatan)',
    parser: dateParserToISOString('yyyy-MM-dd HH:mm'),
  },
  shippingTimeArranged: {
    header: 'Waktu Pengiriman Diatur',
    parser: dateParserToISOString('yyyy-MM-dd HH:mm'),
  },
  orderCreationTime: {
    header: 'Waktu Pesanan Dibuat',
    parser: dateParserToISOString('yyyy-MM-dd HH:mm'),
  },
  paymentTimeCompleted: {
    header: 'Waktu Pembayaran Dilakukan',
    parser: dateParserToISOString('yyyy-MM-dd HH:mm'),
  },
  paymentMethod: {
    header: 'Metode Pembayaran',
    parser: stringParser,
  },
  parentSku: {
    header: 'SKU Induk',
    parser: stringParser,
  },
  productName: {
    header: 'Nama Produk',
    parser: stringParser,
  },
  skuReferenceNumber: {
    header: 'Nomor Referensi SKU',
    parser: stringParser,
  },
  variationName: {
    header: 'Nama Variasi',
    parser: stringParser,
  },
  originalPrice: {
    header: 'Harga Awal',
    parser: numberParser,
  },
  priceAfterDiscount: {
    header: 'Harga Setelah Diskon',
    parser: numberParser,
  },
  quantity: {
    header: 'Jumlah',
    parser: numberParser,
  },
  returnedQuantity: {
    header: 'Returned quantity',
    parser: numberParser,
  },
  orderSubtotal: {
    header: 'Subtotal Pesanan',
    parser: numberParser,
  },
  totalDiscount: {
    header: 'Total Diskon',
    parser: numberParser,
  },
  discountFromSeller: {
    header: 'Diskon Dari Penjual',
    parser: numberParser,
  },
  discountFromShopee: {
    header: 'Diskon Dari Shopee',
    parser: numberParser,
  },
  productWeight: {
    header: 'Berat Produk',
    parser: numberParser,
  },
  numberOfProductsOrdered: {
    header: 'Jumlah Produk di Pesan',
    parser: numberParser,
  },
  totalWeight: {
    header: 'Total Berat',
    parser: numberParser,
  },
  voucherBorneBySeller: {
    header: 'Voucher Ditanggung Penjual',
    parser: numberParser,
  },
  coinCashback: {
    header: 'Cashback Koin',
    parser: numberParser,
  },
  voucherBorneByShopee: {
    header: 'Voucher Ditanggung Shopee',
    parser: numberParser,
  },
  bundleDeal: {
    header: 'Paket Diskon',
    parser: booleanParser('Y', 'N'),
  },
  bundleDealDiscountFromShopee: {
    header: 'Paket Diskon (Diskon dari Shopee)',
    parser: numberParser,
  },
  bundleDealDiscountFromSeller: {
    header: 'Paket Diskon (Diskon dari Penjual)',
    parser: numberParser,
  },
  shopeeCoinOffset: {
    header: 'Potongan Koin Shopee',
    parser: numberParser,
  },
  creditCardDiscount: {
    header: 'Diskon Kartu Kredit',
    parser: numberParser,
  },
  shippingCostPaidByBuyer: {
    header: 'Ongkos Kirim Dibayar oleh Pembeli',
    parser: numberParser,
  },
  estimatedShippingFeeDiscount: {
    header: 'Estimasi Potongan Biaya Pengiriman',
    parser: numberParser,
  },
  returnShippingCosts: {
    header: 'Ongkos Kirim Pengembalian Barang',
    parser: numberParser,
  },
  totalPayment: {
    header: 'Total Pembayaran',
    parser: numberParser,
  },
  estimatedShippingCosts: {
    header: 'Perkiraan Ongkos Kirim',
    parser: numberParser,
  },
  buyerNote: {
    header: 'Catatan dari Pembeli',
    parser: stringParser,
  },
  note: {
    header: 'Catatan',
    parser: stringParser,
  },
  buyerUsername: {
    header: 'Username (Pembeli)',
    parser: stringParser,
  },
  receiverName: {
    header: 'Nama Penerima',
    parser: stringParser,
  },
  phoneNumber: {
    header: 'No. Telepon',
    parser: stringParser,
  },
  deliveryAddress: {
    header: 'Alamat Pengiriman',
    parser: stringParser,
  },
  cityRegency: {
    header: 'Kota/Kabupaten',
    parser: stringParser,
  },
  province: {
    header: 'Provinsi',
    parser: stringParser,
  },
  orderCompletionTime: {
    header: 'Waktu Pesanan Selesai',
    parser: dateParserToISOString('yyyy-MM-dd HH:mm'),
  },
} satisfies Record<string, FieldConfig>;
