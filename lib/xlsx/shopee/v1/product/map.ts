import { toTrimmedString } from '@/lib/string';
import { parseIndonesianNumber } from '@/lib/number';

export type FieldConfig = {
  header: string;
  parser: (val: unknown) => any;
  dbField?: string;
};

export const PRODUCT_FIELD_MAP = {
  productId: {
    header: 'Kode Produk',
    parser: toTrimmedString,
    dbField: '',
  },
  productName: {
    header: 'Nama Produk',
    parser: toTrimmedString,
    dbField: '',
  },
  variantId: {
    header: 'Kode Variasi',
    parser: toTrimmedString,
    dbField: '',
  },
  variantName: {
    header: 'Nama Variasi',
    parser: toTrimmedString,
    dbField: '',
  },
  parentSKU: {
    header: 'SKU Induk',
    parser: toTrimmedString,
    dbField: '',
  },
  SKU: {
    header: 'SKU',
    parser: toTrimmedString,
    dbField: '',
  },
  price: {
    header: 'Harga',
    parser: parseIndonesianNumber,
    dbField: '',
  },
  GTIN: {
    header: 'GTIN',
    parser: toTrimmedString,
    dbField: '',
  },
  stock: {
    header: 'Stok',
    parser: parseIndonesianNumber,
    dbField: '',
  },
  minimumPurchaseAmount: {
    header: 'Min. Jumlah Pembelian',
    parser: parseIndonesianNumber,
    dbField: '',
  },
  maximumPurchaseAmount: {
    header: 'Maks. Jumlah Pembelian',
    parser: parseIndonesianNumber,
    dbField: '',
  },
  maximumPurchaseAmountAndStartDate: {
    header: 'Maks. Jumlah Pembelian - Tanggal Mulai',
    parser: toTrimmedString,
    dbField: '',
  },
  maximumPurchaseAmountAndTotalDays: {
    header: 'Maks. Jumlah Pembelian - Jumlah Hari',
    parser: toTrimmedString,
    dbField: '',
  },
  maximumPurchaseAmountAndEndDate: {
    header: 'Maks. Jumlah Pembelian - Tanggal Berakhir',
    parser: toTrimmedString,
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
