import { toTrimmedString } from '@/lib/string';
import { parseIndonesianNumber } from '@/lib/number';
import { createBooleanParser } from '@/lib/boolean';
import { parseExcelDateToISOString } from '@/lib/date';

export type FieldConfig = {
  header: string;
  parser: (val: unknown) => unknown;
  columnIndex?: number;
};

export const COMPLETED_ORDER_FIELD_MAP = {
  orderId: {
    header: 'No. Pesanan',
    parser: toTrimmedString,
  },
  orderStatus: {
    header: 'Status Pesanan',
    parser: toTrimmedString,
  },
  shippedByAdvanceFulfilment: {
    header: 'Shipped by Advance Fulfilment',
    parser: createBooleanParser(
      'Y',
      'N'
    ) /* original: shipped_by_advance_fulfilment */,
  },
  cancellationReturnStatus: {
    header: 'Status Pembatalan/ Pengembalian',
    parser: toTrimmedString,
  },
  trackingNumber: {
    header: 'No. Resi',
    parser: toTrimmedString,
  },
  shippingOption: {
    header: 'Opsi Pengiriman',
    parser: toTrimmedString,
  },
  dropOffCounterPickUp: {
    header: 'Antar ke counter/ pick-up',
    parser: toTrimmedString,
  },
  orderMustBeShippedBeforeAvoidLateShipment: {
    header:
      'Pesanan Harus Dikirimkan Sebelum (Menghindari keterlambatan)',
    parser: parseExcelDateToISOString(
      'yyyy-MM-dd HH:mm'
    ) /* original: order_must_be_shipped_before_avoid_late_shipment */,
  },
  shippingTimeArranged: {
    header: 'Waktu Pengiriman Diatur',
    parser: parseExcelDateToISOString('yyyy-MM-dd HH:mm'),
  },
  orderCreationTime: {
    header: 'Waktu Pesanan Dibuat',
    parser: parseExcelDateToISOString('yyyy-MM-dd HH:mm'),
  },
  paymentTimeCompleted: {
    header: 'Waktu Pembayaran Dilakukan',
    parser: parseExcelDateToISOString('yyyy-MM-dd HH:mm'),
  },
  type: {
    header: 'Tipe Pesanan',
    parser: toTrimmedString,
  },
  paymentMethod: {
    header: 'Metode Pembayaran',
    parser: toTrimmedString,
  },
  parentSku: {
    header: 'SKU Induk',
    parser: toTrimmedString,
  },
  productName: {
    header: 'Nama Produk',
    parser: toTrimmedString,
  },
  skuReferenceNumber: {
    header: 'Nomor Referensi SKU',
    parser: toTrimmedString,
  },
  variationName: {
    header: 'Nama Variasi',
    parser: toTrimmedString,
  },
  originalPrice: {
    header: 'Harga Awal',
    parser: parseIndonesianNumber,
  },
  priceAfterDiscount: {
    header: 'Harga Setelah Diskon',
    parser: parseIndonesianNumber,
  },
  quantity: {
    header: 'Jumlah',
    parser: parseIndonesianNumber,
  },
  returnedQuantity: {
    header: 'Returned quantity',
    parser: parseIndonesianNumber,
  },
  orderSubtotal: {
    header: 'Subtotal Pesanan',
    parser: parseIndonesianNumber,
  },
  totalDiscount: {
    header: 'Total Diskon',
    parser: parseIndonesianNumber,
  },
  discountFromSeller: {
    header: 'Diskon Dari Penjual',
    parser: parseIndonesianNumber,
  },
  discountFromShopee: {
    header: 'Diskon Dari Shopee',
    parser: parseIndonesianNumber,
  },
  productWeight: {
    header: 'Berat Produk',
    parser: parseIndonesianNumber,
  },
  numberOfProductsOrdered: {
    header: 'Jumlah Produk di Pesan',
    parser: parseIndonesianNumber,
  },
  totalWeight: {
    header: 'Total Berat',
    parser: parseIndonesianNumber,
  },
  voucherBorneBySeller: {
    header: 'Voucher Ditanggung Penjual',
    parser: parseIndonesianNumber,
  },
  coinCashback: {
    header: 'Cashback Koin',
    parser: parseIndonesianNumber,
  },
  voucherBorneByShopee: {
    header: 'Voucher Ditanggung Shopee',
    parser: parseIndonesianNumber,
  },
  voucherCode: {
    header: 'Kode Voucher',
    parser: toTrimmedString,
  },
  bundleDeal: {
    header: 'Paket Diskon',
    parser: createBooleanParser('Y', 'N'),
  },
  bundleDealDiscountFromShopee: {
    header: 'Paket Diskon (Diskon dari Shopee)',
    parser:
      parseIndonesianNumber /* original: bundle_deal_discount_from_shopee */,
  },
  bundleDealDiscountFromSeller: {
    header: 'Paket Diskon (Diskon dari Penjual)',
    parser:
      parseIndonesianNumber /* original: bundle_deal_discount_from_seller */,
  },
  shopeeCoinOffset: {
    header: 'Potongan Koin Shopee',
    parser: parseIndonesianNumber,
  },
  creditCardDiscount: {
    header: 'Diskon Kartu Kredit',
    parser: parseIndonesianNumber,
  },
  shippingCostPaidByBuyer: {
    header: 'Ongkos Kirim Dibayar oleh Pembeli',
    parser: parseIndonesianNumber,
  },
  estimatedShippingCostDiscount: {
    header: 'Estimasi Potongan Biaya Pengiriman',
    parser:
      parseIndonesianNumber /* original: estimated_shipping_cost_discount */,
  },
  returnShippingFee: {
    header: 'Ongkos Kirim Pengembalian Barang',
    parser: parseIndonesianNumber,
  },
  totalPayment: {
    header: 'Total Pembayaran',
    parser: parseIndonesianNumber,
  },
  estimatedShippingCost: {
    header: 'Perkiraan Ongkos Kirim',
    parser: parseIndonesianNumber,
  },
  buyerNote: {
    header: 'Catatan dari Pembeli',
    parser: toTrimmedString,
  },
  note: {
    header: 'Catatan',
    parser: toTrimmedString,
  },
  username: {
    header: 'Username (Pembeli)',
    parser: toTrimmedString,
  },
  receiverName: {
    header: 'Nama Penerima',
    parser: toTrimmedString,
  },
  phoneNumber: {
    header: 'No. Telepon',
    parser: toTrimmedString,
  },
  deliveryAddress: {
    header: 'Alamat Pengiriman',
    parser: toTrimmedString,
  },
  cityRegency: {
    header: 'Kota/Kabupaten',
    parser: toTrimmedString,
  },
  province: {
    header: 'Provinsi',
    parser: toTrimmedString,
  },
  orderCompletionTime: {
    header: 'Waktu Pesanan Selesai',
    parser: parseExcelDateToISOString('yyyy-MM-dd HH:mm'),
  },
} satisfies Record<string, FieldConfig>;
