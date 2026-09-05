import {
  getColIdx,
  getColIdxWithFallback,
} from '@/lib/xlsx/utils';
import { INCOME_FIELD_MAP, type FieldConfig } from './map';
import type {
  IncomeFieldKey,
  ParsedIncomeRow,
} from './types';

const HEADER_DETECTION_KEY = 'Lihat berdasarkan';
const SHOPEE_ORDER_PROCESSING_FEE = process.env
  .SHOPEE_ORDER_PROCESSING_FEE
  ? Number(process.env.SHOPEE_ORDER_PROCESSING_FEE)
  : 1250;

export default function parseIncomeSheet(
  rows: unknown[][],
  headers: string[],
  headerRowIndex: number
): ParsedIncomeRow[] {
  const columnIndexes = {} as Record<
    IncomeFieldKey,
    number
  >;
  // let headerRowIndex = -1;
  // for (let i = 0; i < Math.min(rows.length, 10); i++) {
  //   if (rows[i] && rows[i].includes(HEADER_DETECTION_KEY)) {
  //     headerRowIndex = i;
  //     break;
  //   }
  // }

  // if (headerRowIndex === -1) {
  //   throw new Error(
  //     'Kolom No. Pesanan tidak ditemukan di Laporan Penghasilan.'
  //   );
  // }

  // const headers = rows[headerRowIndex].map((header) =>
  //   String(header).trim()
  // );

  // console.log('headers', JSON.stringify(headers, null, 2));

  // const indices = {} as Record<IncomeFieldKey, number>;

  for (const [key, config] of Object.entries(
    INCOME_FIELD_MAP
  ) as [IncomeFieldKey, FieldConfig][]) {
    // let colIdx =
    //   config.columnIndex ??
    //   getColIdx(headers, config.header || '');

    // if (colIdx === -1) {
    //   colIdx = headers.findIndex((h) =>
    //     h.includes(config.header)
    //   );

    //   if (colIdx === -1) {
    //     console.warn(
    //       `${config.header} tidak ditemukan di Laporan Dana Dilepas V2 Sheet "Penghasilan".`
    //     );
    //   }
    // }

    const colIdx =
      config.columnIndex ??
      getColIdxWithFallback(headers, config.header || '');

    if (colIdx === -1) {
      console.warn(
        `${config.header} tidak ditemukan di Laporan Dana Dilepas V2 Sheet "Penghasilan".`
      );
    }

    columnIndexes[key] = colIdx;
  }

  const result: ParsedIncomeRow[] = [];
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    // console.log('rows[i]', rows[i]);
    const row = rows[i];

    const parsedRow = {} as ParsedIncomeRow;
    for (const [key, config] of Object.entries(
      INCOME_FIELD_MAP
    ) as [IncomeFieldKey, FieldConfig][]) {
      const idx = columnIndexes[key];
      const rawValue =
        idx !== undefined && idx !== -1
          ? row[idx]
          : undefined;
      parsedRow[key] = config.parser(rawValue);

      // console.log({ key, idx });
    }
    result.push(parsedRow);
  }

  return result;

  // // Map seller fee worksheet row by order id
  // const ordersMap = new Map<string, ParsedIncomeRow[]>();
  // // const productNames = new Set<string>();
  // const productIds = new Set<string>();
  // for (const item of sellerFee) {
  //   const orderId = String(item.orderId);

  //   if (!ordersMap.has(orderId)) {
  //     ordersMap.set(orderId, []);
  //   }
  //   ordersMap.get(orderId)!.push(item);
  //   // productNames.add(String(item.productName));
  //   if (item.productId !== '-') {
  //     productIds.add(String(item.productId));
  //   }
  // }

  // const orderIdIdx = indices.orderId;
  // return rows
  //   .slice(headerRowIndex + 1)
  //   .filter((row) => {
  //     if (!row || row.length === 0) return false;
  //     if (orderIdIdx === -1) return true;
  //     return String(row[orderIdIdx] ?? '').trim() !== '';
  //   })
  //   .map((row) => {
  //     const incomeRow = {} as ParsedIncomeRow;
  //     for (const [key, config] of Object.entries(
  //       INCOME_FIELD_MAP
  //     ) as [IncomeFieldKey, FieldConfig][]) {
  //       const idx = indices[key];
  //       const rawValue = idx !== -1 ? row[idx] : undefined;
  //       incomeRow[key] = config.parser(rawValue);
  //     }
  //     return incomeRow;
  //   });
}
