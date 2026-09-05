import {
  getColIdx,
  getColIdxWithFallback,
} from '@/lib/xlsx/utils';
import {
  SELLER_FEE_FIELD_MAP,
  type FieldConfig,
} from './map';
import type {
  SellerFeeFieldKey,
  ParsedSellerFeeRow,
} from './types';

export default function parseIncomeSheet(
  rows: unknown[][],
  headers: string[],
  headerRowIndex: number
): ParsedSellerFeeRow[] {
  const columnIndexes = {} as Record<
    SellerFeeFieldKey,
    number
  >;

  for (const [key, config] of Object.entries(
    SELLER_FEE_FIELD_MAP
  ) as [SellerFeeFieldKey, FieldConfig][]) {
    // let colIdx =
    //   config.columnIndex ??
    //   getColIdx(headers, config.header || '');

    // if (colIdx === -1) {
    //   colIdx = headers.findIndex((h) =>
    //     h.includes(config.header)
    //   );

    //   if (colIdx === -1) {
    //     console.warn(
    //       `Kolom ${config.header} tidak ditemukan di Laporan Dana Dilepas V2 Sheet "Seller Fee".`
    //     );
    //   }
    // }

    const colIdx =
      config.columnIndex ??
      getColIdxWithFallback(headers, config.header || '');

    if (colIdx === -1) {
      console.warn(
        `${config.header} tidak ditemukan di Laporan Dana Dilepas V2 Sheet "Seller Fee".`
      );
    }

    columnIndexes[key] = colIdx;
  }

  const result: ParsedSellerFeeRow[] = [];
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    // console.log('rows[i]', rows[i]);
    const row = rows[i];

    const parsedRow = {} as ParsedSellerFeeRow;
    for (const [key, config] of Object.entries(
      SELLER_FEE_FIELD_MAP
    ) as [SellerFeeFieldKey, FieldConfig][]) {
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
}
