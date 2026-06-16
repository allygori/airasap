import {
  stringParser,
  numberParser,
} from '@/lib/utils/parser';

export type FieldConfig = {
  header: string;
  parser: (val: unknown) => any;
  dbField?: string;
};

export const PRODUCT_FIELD_MAP = {
  productId: {
    header: 'Kode Produk',
    parser: stringParser,
    dbField: '',
  },
  productName: {
    header: 'Nama Produk',
    parser: stringParser,
    dbField: '',
  },
  variantId: {
    header: 'Kode Variasi',
    parser: stringParser,
    dbField: '',
  },
  variantName: {
    header: 'Nama Variasi',
    parser: stringParser,
    dbField: '',
  },
  parentSKU: {
    header: 'SKU Induk',
    parser: stringParser,
    dbField: '',
  },
  SKU: {
    header: 'SKU',
    parser: stringParser,
    dbField: '',
  },
  price: {
    header: 'Harga',
    parser: numberParser,
    dbField: '',
  },
  GTIN: {
    header: 'GTIN',
    parser: stringParser,
    dbField: '',
  },
  stock: {
    header: 'Stok',
    parser: numberParser,
    dbField: '',
  },
  minimumPurchaseAmount: {
    header: 'Min. Jumlah Pembelian',
    parser: numberParser,
    dbField: '',
  },
  maximumPurchaseAmount: {
    header: 'Maks. Jumlah Pembelian',
    parser: numberParser,
    dbField: '',
  },
  maximumPurchaseAmountAndStartDate: {
    header: 'Maks. Jumlah Pembelian - Tanggal Mulai',
    parser: stringParser,
    dbField: '',
  },
  maximumPurchaseAmountAndTotalDays: {
    header: 'Maks. Jumlah Pembelian - Jumlah Hari',
    parser: stringParser,
    dbField: '',
  },
  maximumPurchaseAmountAndEndDate: {
    header: 'Maks. Jumlah Pembelian - Tanggal Berakhir',
    parser: stringParser,
    dbField: '',
  },
} satisfies Record<string, FieldConfig>;

// export type ProductFieldKey =
//   keyof typeof PRODUCT_FIELD_MAP;

// export type ParsedOrderRow = Record<
//   ProductFieldKey,
//   ReturnType<
//     (typeof PRODUCT_FIELD_MAP)[ProductFieldKey]['parser']
//   >
// >;
