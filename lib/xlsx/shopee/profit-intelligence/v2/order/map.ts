import {
  stringParser,
  numberParser,
  dateParser,
  booleanParser,
} from '../utils';

export type FieldConfig = {
  header: string;
  parser: (val: unknown) => any;
};

export const ORDER_FIELD_MAP: Record<string, FieldConfig> =
  {
    order_id: {
      header: 'No. Pesanan',
      parser: stringParser,
    },
    status: {
      header: 'Status Pesanan',
      parser: stringParser,
    },
    cancellation_return_status: {
      header: 'Status Pembatalan/ Pengembalian',
      parser: stringParser,
    },
    username: {
      header: 'Username (Pembeli)',
      parser: stringParser,
    },
    number_of_products_ordered: {
      header: 'Jumlah Produk di Pesan',
      parser: numberParser,
    },
    total_payment: {
      header: 'Total Pembayaran',
      parser: numberParser,
    },
    payment_method: {
      header: 'Metode Pembayaran',
      parser: stringParser,
    },
    paid_at: {
      header: 'Waktu Pembayaran Dilakukan',
      parser: dateParser,
    },
    order_subtotal: {
      header: 'Subtotal Pesanan',
      parser: numberParser,
    },
    total_discount: {
      header: 'Total Diskon',
      parser: numberParser,
    },
    discount_from_seller: {
      header: 'Diskon Dari Penjual',
      parser: numberParser,
    },
    discount_from_shopee: {
      header: 'Diskon Dari Shopee',
      parser: numberParser,
    },
    voucher_borne_by_seller: {
      header: 'Voucher Ditanggung Penjual',
      parser: numberParser,
    },
    voucher_borne_by_shopee: {
      header: 'Voucher Ditanggung Shopee',
      parser: numberParser,
    },
    coin_cashback: {
      header: 'Cashback Koin',
      parser: numberParser,
    },
    bundle_deal: {
      header: 'Paket Diskon',
      parser: booleanParser('Y', 'N'),
    },
    bundle_deal_discount_from_shopee: {
      header: 'Paket Diskon (Diskon dari Shopee)',
      parser: numberParser,
    },
    bundle_deal_discount_from_seller: {
      header: 'Paket Diskon (Diskon dari Penjual)',
      parser: numberParser,
    },
    shopee_coin_offset: {
      header: 'Potongan Koin Shopee',
      parser: numberParser,
    },
    credit_card_discount: {
      header: 'Diskon Kartu Kredit',
      parser: numberParser,
    },
    shipping_option: {
      header: 'Opsi Pengiriman',
      parser: stringParser,
    },
    estimated_shipping_fee: {
      header: 'Perkiraan Ongkos Kirim',
      parser: numberParser,
    },
    shipping_fee_paid_by_buyer: {
      header: 'Ongkos Kirim Dibayar oleh Pembeli',
      parser: numberParser,
    },
    estimated_shipping_fee_discount: {
      header: 'Estimasi Potongan Biaya Pengiriman',
      parser: numberParser,
    },
    product_weight: {
      header: 'Berat Produk',
      parser: numberParser,
    },
    total_weight: {
      header: 'Total Berat',
      parser: numberParser,
    },
    receiver_name: {
      header: 'Nama Penerima',
      parser: stringParser,
    },
    phone_number: {
      header: 'No. Telepon',
      parser: stringParser,
    },
    buyer_note: {
      header: 'Catatan dari Pembeli',
      parser: stringParser,
    },
    note: { header: 'Catatan', parser: stringParser },
    shipping_arranged_at: {
      header: 'Waktu Pengiriman Diatur',
      parser: dateParser,
    },
    order_created_at: {
      header: 'Waktu Pesanan Dibuat',
      parser: dateParser,
    },
    order_completed_at: {
      header: 'Waktu Pesanan Selesai',
      parser: dateParser,
    },

    // Custom nesting for address fields
    address_street: {
      header: 'Alamat Pengiriman',
      parser: stringParser,
    },
    address_city: {
      header: 'Kota/Kabupaten',
      parser: stringParser,
    },
    address_province: {
      header: 'Provinsi',
      parser: stringParser,
    },
  };

export const ITEM_FIELD_MAP: Record<string, FieldConfig> = {
  parent_sku: { header: 'SKU Induk', parser: stringParser },
  sku_reference_number: {
    header: 'Nomor Referensi SKU',
    parser: stringParser,
  },
  product_name: {
    header: 'Nama Produk',
    parser: stringParser,
  },
  variation_name: {
    header: 'Nama Variasi',
    parser: stringParser,
  },
  original_price: {
    header: 'Harga Awal',
    parser: numberParser,
  },
  price_after_discount: {
    header: 'Harga Setelah Diskon',
    parser: numberParser,
  },
  quantity: { header: 'Jumlah', parser: numberParser },
  returned_quantity: {
    header: 'Returned quantity',
    parser: numberParser,
  },
};
