import {
  stringParser,
  numberParser,
  dateParser,
} from '../utils';

export type FieldConfig = {
  header: string;
  parser: (val: unknown) => any;
};

export const INCOME_FIELD_MAP: Record<string, FieldConfig> =
  {
    order_id: {
      header: 'No. Pesanan',
      parser: stringParser,
    },
    username: {
      header: 'Username (Pembeli)',
      parser: stringParser,
    },
    order_created_at: {
      header: 'Waktu Pesanan Dibuat',
      parser: dateParser,
    },
    order_released_at: {
      header: 'Tanggal Dana Dilepaskan',
      parser: dateParser,
    },
    payment_method: {
      header: 'Metode pembayaran pembeli',
      parser: stringParser,
    },
    order_subtotal: {
      header: 'Harga Asli Produk',
      parser: numberParser,
    },
    total_discount: {
      header: 'Total Diskon Produk',
      parser: numberParser,
    },
    admin_fee: {
      header: 'Biaya Administrasi',
      parser: numberParser,
    },
    service_fee: {
      header: 'Biaya Layanan',
      parser: numberParser,
    },
    order_process_fee: {
      header: 'Biaya Proses Pesanan',
      parser: numberParser,
    },
    transaction_fee: {
      header: 'Biaya Transaksi',
      parser: numberParser,
    },
    campaign_fee: {
      header: 'Biaya Kampanye',
      parser: numberParser,
    },
    released_amount: {
      header: 'Total Penghasilan',
      parser: numberParser,
    },
    logistic_service: {
      header: 'Nama Kurir',
      parser: stringParser,
    },
    voucher_code: {
      header: 'Kode Voucher',
      parser: stringParser,
    },
    voucher_value: {
      header: 'Voucher disponsor oleh Penjual',
      parser: numberParser,
    },
  };
