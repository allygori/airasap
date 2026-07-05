// export type ProductExcelRow = {
//   productId: string;
//   productName: string;
//   variationId: number;
//   variationName: string;
//   sku?: string;
//   price: number;
//   gtin?: string;
//   quantity: number;
// };

import { PRODUCT_FIELD_MAP } from './map';

export type ProductFieldKey =
  keyof typeof PRODUCT_FIELD_MAP;

export type ParsedOrderRow = Record<
  ProductFieldKey,
  ReturnType<
    (typeof PRODUCT_FIELD_MAP)[ProductFieldKey]['parser']
  >
>;
