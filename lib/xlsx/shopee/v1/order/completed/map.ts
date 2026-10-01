import { toTrimmedString } from '@/lib/string';
import { parseIndonesianNumber } from '@/lib/number';
import { parseExcelDate } from '@/lib/date';
import { createBooleanParser } from '@/lib/boolean';

export type FieldConfig = {
  header: string;
  parser: (val: unknown) => unknown;
  dbField?: string;
};

export const ORDER_FIELD_MAP = {
  orderId: {
    header: 'No. Pesanan',
    parser: toTrimmedString,
    dbField: '' /* original: no_order */,
  },
  orderStatus: {
    header: 'Status Pesanan',
    parser: toTrimmedString,
    dbField: '' /* original: order_status */,
  },
  shippedByAdvanceFulfilment: {
    header: 'Shipped by Advance Fulfilment',
    parser: createBooleanParser('Y', 'N'),
    dbField:
      '' /* original: shipped_by_advance_fulfilment */,
  },
  cancellationReturnStatus: {
    header: 'Status Pembatalan/ Pengembalian',
    parser: toTrimmedString,
    dbField: '' /* original: cancellation_return_status */,
  },
  trackingNumber: {
    header: 'No. Resi',
    parser: toTrimmedString,
    dbField: '' /* original: tracking_number */,
  },
  shippingOption: {
    header: 'Opsi Pengiriman',
    parser: toTrimmedString,
    dbField: '' /* original: shipping_option */,
  },
  dropOffCounterPickUp: {
    header: 'Antar ke counter/ pick-up',
    parser: toTrimmedString,
    dbField: '' /* original: drop_off_counter_pick_up */,
  },
  orderMustBeShippedBeforeAvoidLateShipment: {
    header:
      'Pesanan Harus Dikirimkan Sebelum (Menghindari keterlambatan)',
    parser: parseExcelDate('yyyy-MM-dd HH:mm'),
    dbField:
      '' /* original: order_must_be_shipped_before_avoid_late_shipment */,
  },
  shippingTimeArranged: {
    header: 'Waktu Pengiriman Diatur',
    parser: parseExcelDate('yyyy-MM-dd HH:mm'),
    dbField: '' /* original: shipping_time_arranged */,
  },
  orderCreationTime: {
    header: 'Waktu Pesanan Dibuat',
    parser: parseExcelDate('yyyy-MM-dd HH:mm'),
    dbField: '' /* original: order_creation_time */,
  },
  paymentTimeCompleted: {
    header: 'Waktu Pembayaran Dilakukan',
    parser: parseExcelDate('yyyy-MM-dd HH:mm'),
    dbField: '' /* original: payment_time_completed */,
  },
  paymentMethod: {
    header: 'Metode Pembayaran',
    parser: toTrimmedString,
    dbField: '' /* original: payment_method */,
  },
  parentSku: {
    header: 'SKU Induk',
    parser: toTrimmedString,
    dbField: '' /* original: parent_sku */,
  },
  productName: {
    header: 'Nama Produk',
    parser: toTrimmedString,
    dbField: '' /* original: product_name */,
  },
  skuReferenceNumber: {
    header: 'Nomor Referensi SKU',
    parser: toTrimmedString,
    dbField: '' /* original: child_sku */,
  },
  variationName: {
    header: 'Nama Variasi',
    parser: toTrimmedString,
    dbField: '' /* original: variation_name */,
  },
  originalPrice: {
    header: 'Harga Awal',
    parser: parseIndonesianNumber,
    dbField: '' /* original: original_price */,
  },
  priceAfterDiscount: {
    header: 'Harga Setelah Diskon',
    parser: parseIndonesianNumber,
    dbField: '' /* original: price_after_discount */,
  },
  quantity: {
    header: 'Jumlah',
    parser: parseIndonesianNumber,
    dbField: '' /* original: quantity */,
  },
  returnedQuantity: {
    header: 'Returned quantity',
    parser: parseIndonesianNumber,
    dbField: '' /* original: returned_quantity */,
  },
  orderSubtotal: {
    header: 'Subtotal Pesanan',
    parser: parseIndonesianNumber,
    dbField: '' /* original: order_subtotal */,
  },
  totalDiscount: {
    header: 'Total Diskon',
    parser: parseIndonesianNumber,
    dbField: '' /* original: total_discount */,
  },
  discountFromSeller: {
    header: 'Diskon Dari Penjual',
    parser: parseIndonesianNumber,
    dbField: '' /* original: discount_from_seller */,
  },
  discountFromShopee: {
    header: 'Diskon Dari Shopee',
    parser: parseIndonesianNumber,
    dbField: '' /* original: discount_from_shopee */,
  },
  productWeight: {
    header: 'Berat Produk',
    parser: parseIndonesianNumber,
    dbField: '' /* original: product_weight */,
  },
  numberOfProductsOrdered: {
    header: 'Jumlah Produk di Pesan',
    parser: parseIndonesianNumber,
    dbField: '' /* original: number_of_products_ordered */,
  },
  totalWeight: {
    header: 'Total Berat',
    parser: parseIndonesianNumber,
    dbField: '' /* original: total_weight */,
  },
  voucherBorneBySeller: {
    header: 'Voucher Ditanggung Penjual',
    parser: parseIndonesianNumber,
    dbField: '' /* original: voucher_borne_by_seller */,
  },
  coinCashback: {
    header: 'Cashback Koin',
    parser: parseIndonesianNumber,
    dbField: '' /* original: coin_cashback */,
  },
  voucherBorneByShopee: {
    header: 'Voucher Ditanggung Shopee',
    parser: parseIndonesianNumber,
    dbField: '' /* original: voucher_borne_by_shopee */,
  },
  voucherCode: {
    header: 'Kode Voucher',
    parser: toTrimmedString,
    dbField: '' /* original: voucher_code */,
  },
  bundleDeal: {
    header: 'Paket Diskon',
    parser: createBooleanParser('Y', 'N'),
    dbField: '' /* original: bundle_deal */,
  },
  bundleDealDiscountFromShopee: {
    header: 'Paket Diskon (Diskon dari Shopee)',
    parser: parseIndonesianNumber,
    dbField:
      '' /* original: bundle_deal_discount_from_shopee */,
  },
  bundleDealDiscountFromSeller: {
    header: 'Paket Diskon (Diskon dari Penjual)',
    parser: parseIndonesianNumber,
    dbField:
      '' /* original: bundle_deal_discount_from_seller */,
  },
  shopeeCoinOffset: {
    header: 'Potongan Koin Shopee',
    parser: parseIndonesianNumber,
    dbField: '' /* original: shopee_coin_offset */,
  },
  creditCardDiscount: {
    header: 'Diskon Kartu Kredit',
    parser: parseIndonesianNumber,
    dbField: '' /* original: credit_card_discount */,
  },
  shippingCostPaidByBuyer: {
    header: 'Ongkos Kirim Dibayar oleh Pembeli',
    parser: parseIndonesianNumber,
    dbField: '' /* original: shipping_cost_paid_by_buyer */,
  },
  estimatedShippingCostDiscount: {
    header: 'Estimasi Potongan Biaya Pengiriman',
    parser: parseIndonesianNumber,
    dbField:
      '' /* original: estimated_shipping_cost_discount */,
  },
  returnShippingFee: {
    header: 'Ongkos Kirim Pengembalian Barang',
    parser: parseIndonesianNumber,
    dbField: '' /* original: return_shipping_fee */,
  },
  totalPayment: {
    header: 'Total Pembayaran',
    parser: parseIndonesianNumber,
    dbField: '' /* original: total_payment */,
  },
  estimatedShippingCost: {
    header: 'Perkiraan Ongkos Kirim',
    parser: parseIndonesianNumber,
    dbField: '' /* original: estimated_shipping_cost */,
  },
  buyerNote: {
    header: 'Catatan dari Pembeli',
    parser: toTrimmedString,
    dbField: '' /* original: buyer_note */,
  },
  note: {
    header: 'Catatan',
    parser: toTrimmedString,
    dbField: '' /* original: note */,
  },
  buyerUsername: {
    header: 'Username (Pembeli)',
    parser: toTrimmedString,
    dbField: '' /* original: buyer_username */,
  },
  receiverName: {
    header: 'Nama Penerima',
    parser: toTrimmedString,
    dbField: '' /* original: receiver_name */,
  },
  phoneNumber: {
    header: 'No. Telepon',
    parser: toTrimmedString,
    dbField: '' /* original: phone_number */,
  },
  deliveryAddress: {
    header: 'Alamat Pengiriman',
    parser: toTrimmedString,
    dbField: '' /* original: delivery_address */,
  },
  cityRegency: {
    header: 'Kota/Kabupaten',
    parser: toTrimmedString,
    dbField: '' /* original: city_regency */,
  },
  province: {
    header: 'Provinsi',
    parser: toTrimmedString,
    dbField: '' /* original: province */,
  },
  orderCompletionTime: {
    header: 'Waktu Pesanan Selesai',
    parser: parseExcelDate('yyyy-MM-dd HH:mm'),
    dbField: '' /* original: order_completion_time */,
  },
} satisfies Record<string, FieldConfig>;

export type OrderFieldKey = keyof typeof ORDER_FIELD_MAP;
