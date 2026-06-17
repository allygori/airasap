import {
  stringParser,
  numberParser,
  dateParser,
  booleanParser,
} from '@/lib/xlsx/utils';

export type FieldConfig = {
  header: string;
  parser: (val: unknown) => any;
  dbField?: string;
};

export const ORDER_FIELD_MAP = {
  orderId: {
    header: 'No. Pesanan',
    parser: stringParser,
    dbField: '' /* original: no_order */,
  },
  orderStatus: {
    header: 'Status Pesanan',
    parser: stringParser,
    dbField: '' /* original: order_status */,
  },
  shippedByAdvanceFulfilment: {
    header: 'Shipped by Advance Fulfilment',
    parser: booleanParser('Y', 'N'),
    dbField:
      '' /* original: shipped_by_advance_fulfilment */,
  },
  cancellationReturnStatus: {
    header: 'Status Pembatalan/ Pengembalian',
    parser: stringParser,
    dbField: '' /* original: cancellation_return_status */,
  },
  trackingNumber: {
    header: 'No. Resi',
    parser: stringParser,
    dbField: '' /* original: tracking_number */,
  },
  shippingOption: {
    header: 'Opsi Pengiriman',
    parser: stringParser,
    dbField: '' /* original: shipping_option */,
  },
  dropOffCounterPickUp: {
    header: 'Antar ke counter/ pick-up',
    parser: stringParser,
    dbField: '' /* original: drop_off_counter_pick_up */,
  },
  orderMustBeShippedBeforeAvoidLateShipment: {
    header:
      'Pesanan Harus Dikirimkan Sebelum (Menghindari keterlambatan)',
    parser: dateParser,
    dbField:
      '' /* original: order_must_be_shipped_before_avoid_late_shipment */,
  },
  shippingTimeArranged: {
    header: 'Waktu Pengiriman Diatur',
    parser: dateParser,
    dbField: '' /* original: shipping_time_arranged */,
  },
  orderCreationTime: {
    header: 'Waktu Pesanan Dibuat',
    parser: dateParser,
    dbField: '' /* original: order_creation_time */,
  },
  paymentTimeCompleted: {
    header: 'Waktu Pembayaran Dilakukan',
    parser: dateParser,
    dbField: '' /* original: payment_time_completed */,
  },
  paymentMethod: {
    header: 'Metode Pembayaran',
    parser: stringParser,
    dbField: '' /* original: payment_method */,
  },
  parentSku: {
    header: 'SKU Induk',
    parser: stringParser,
    dbField: '' /* original: parent_sku */,
  },
  productName: {
    header: 'Nama Produk',
    parser: stringParser,
    dbField: '' /* original: product_name */,
  },
  skuReferenceNumber: {
    header: 'Nomor Referensi SKU',
    parser: stringParser,
    dbField: '' /* original: sku_reference_number */,
  },
  variationName: {
    header: 'Nama Variasi',
    parser: stringParser,
    dbField: '' /* original: variation_name */,
  },
  originalPrice: {
    header: 'Harga Awal',
    parser: numberParser,
    dbField: '' /* original: original_price */,
  },
  priceAfterDiscount: {
    header: 'Harga Setelah Diskon',
    parser: numberParser,
    dbField: '' /* original: price_after_discount */,
  },
  quantity: {
    header: 'Jumlah',
    parser: numberParser,
    dbField: '' /* original: quantity */,
  },
  returnedQuantity: {
    header: 'Returned quantity',
    parser: numberParser,
    dbField: '' /* original: returned_quantity */,
  },
  orderSubtotal: {
    header: 'Subtotal Pesanan',
    parser: numberParser,
    dbField: '' /* original: order_subtotal */,
  },
  totalDiscount: {
    header: 'Total Diskon',
    parser: numberParser,
    dbField: '' /* original: total_discount */,
  },
  discountFromSeller: {
    header: 'Diskon Dari Penjual',
    parser: numberParser,
    dbField: '' /* original: discount_from_seller */,
  },
  discountFromShopee: {
    header: 'Diskon Dari Shopee',
    parser: numberParser,
    dbField: '' /* original: discount_from_shopee */,
  },
  productWeight: {
    header: 'Berat Produk',
    parser: numberParser,
    dbField: '' /* original: product_weight */,
  },
  numberOfProductsOrdered: {
    header: 'Jumlah Produk di Pesan',
    parser: numberParser,
    dbField: '' /* original: number_of_products_ordered */,
  },
  totalWeight: {
    header: 'Total Berat',
    parser: numberParser,
    dbField: '' /* original: total_weight */,
  },
  voucherBorneBySeller: {
    header: 'Voucher Ditanggung Penjual',
    parser: numberParser,
    dbField: '' /* original: voucher_borne_by_seller */,
  },
  coinCashback: {
    header: 'Cashback Koin',
    parser: numberParser,
    dbField: '' /* original: coin_cashback */,
  },
  voucherBorneByShopee: {
    header: 'Voucher Ditanggung Shopee',
    parser: numberParser,
    dbField: '' /* original: voucher_borne_by_shopee */,
  },
  bundleDeal: {
    header: 'Paket Diskon',
    parser: booleanParser('Y', 'N'),
    dbField: '' /* original: bundle_deal */,
  },
  bundleDealDiscountFromShopee: {
    header: 'Paket Diskon (Diskon dari Shopee)',
    parser: numberParser,
    dbField:
      '' /* original: bundle_deal_discount_from_shopee */,
  },
  bundleDealDiscountFromSeller: {
    header: 'Paket Diskon (Diskon dari Penjual)',
    parser: numberParser,
    dbField:
      '' /* original: bundle_deal_discount_from_seller */,
  },
  shopeeCoinOffset: {
    header: 'Potongan Koin Shopee',
    parser: numberParser,
    dbField: '' /* original: shopee_coin_offset */,
  },
  creditCardDiscount: {
    header: 'Diskon Kartu Kredit',
    parser: numberParser,
    dbField: '' /* original: credit_card_discount */,
  },
  shippingFeePaidByBuyer: {
    header: 'Ongkos Kirim Dibayar oleh Pembeli',
    parser: numberParser,
    dbField: '' /* original: shipping_fee_paid_by_buyer */,
  },
  estimatedShippingFeeDiscount: {
    header: 'Estimasi Potongan Biaya Pengiriman',
    parser: numberParser,
    dbField:
      '' /* original: estimated_shipping_fee_discount */,
  },
  returnShippingFee: {
    header: 'Ongkos Kirim Pengembalian Barang',
    parser: numberParser,
    dbField: '' /* original: return_shipping_fee */,
  },
  totalPayment: {
    header: 'Total Pembayaran',
    parser: numberParser,
    dbField: '' /* original: total_payment */,
  },
  estimatedShippingFee: {
    header: 'Perkiraan Ongkos Kirim',
    parser: numberParser,
    dbField: '' /* original: estimated_shipping_fee */,
  },
  buyerNote: {
    header: 'Catatan dari Pembeli',
    parser: stringParser,
    dbField: '' /* original: buyer_note */,
  },
  note: {
    header: 'Catatan',
    parser: stringParser,
    dbField: '' /* original: note */,
  },
  buyerUsername: {
    header: 'Username (Pembeli)',
    parser: stringParser,
    dbField: '' /* original: buyer_username */,
  },
  receiverName: {
    header: 'Nama Penerima',
    parser: stringParser,
    dbField: '' /* original: receiver_name */,
  },
  phoneNumber: {
    header: 'No. Telepon',
    parser: stringParser,
    dbField: '' /* original: phone_number */,
  },
  deliveryAddress: {
    header: 'Alamat Pengiriman',
    parser: stringParser,
    dbField: '' /* original: delivery_address */,
  },
  cityRegency: {
    header: 'Kota/Kabupaten',
    parser: stringParser,
    dbField: '' /* original: city_regency */,
  },
  province: {
    header: 'Provinsi',
    parser: stringParser,
    dbField: '' /* original: province */,
  },
  orderCompletionTime: {
    header: 'Waktu Pesanan Selesai',
    parser: dateParser,
    dbField: '' /* original: order_completion_time */,
  },
} satisfies Record<string, FieldConfig>;

export type OrderFieldKey = keyof typeof ORDER_FIELD_MAP;
