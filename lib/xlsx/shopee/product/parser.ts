import { getColIdx } from '../../utils';
import {
  PRODUCT_FIELD_MAP,
  // type ProductFieldKey,
} from './map';
import type {
  ParsedOrderRow,
  ProductFieldKey,
} from './types';

const HEADER_DETECTION_KEY = 'Kode Produk';
const ROW_START = 6;

// type ParsedOrderRow = Record<
//   ProductFieldKey,
//   ReturnType<
//     (typeof PRODUCT_FIELD_MAP)[ProductFieldKey]['parser']
//   >
// >;

export default function parser(
  rows: unknown[][]
): ParsedOrderRow[] {
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    if (rows[i] && rows[i].includes(HEADER_DETECTION_KEY)) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error(
      'Format tidak sesuai: Kolom Kode Produk tidak ditemukan di file excel.'
    );
  }

  const headers = rows[headerRowIndex].map((h) =>
    String(h).trim()
  );

  const productIndices = {} as Record<
    ProductFieldKey,
    number
  >;
  for (const [key, config] of Object.entries(
    PRODUCT_FIELD_MAP
  ) as [
    ProductFieldKey,
    (typeof PRODUCT_FIELD_MAP)[ProductFieldKey],
  ][]) {
    const colIdx = getColIdx(headers, config.header);
    productIndices[key] = colIdx;
    if (colIdx === -1) {
      console.warn(
        `${config.header} tidak ditemukan di file excel.`
      );
    }
  }

  // const noOrderIdx = productIndices.noOrder;
  return (
    rows
      .slice(ROW_START)
      // .slice(headerRowIndex + ROW_START)
      // .filter((row) => {
      //   if (!row || row.length === 0) return false;
      //   if (noOrderIdx === -1) return true;
      //   return String(row[noOrderIdx] ?? '').trim() !== '';
      // })
      .map((row) => {
        const productData = {} as ParsedOrderRow;
        for (const [key, config] of Object.entries(
          PRODUCT_FIELD_MAP
        ) as [
          ProductFieldKey,
          (typeof PRODUCT_FIELD_MAP)[ProductFieldKey],
        ][]) {
          const idx = productIndices[key];
          const rawValue =
            idx !== -1 ? row[idx] : undefined;
          productData[key] = config.parser(rawValue);
        }
        return productData;
      })
  );
}
