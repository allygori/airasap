import { getColIdx } from '@/lib/xlsx/utils';
import {
  SELLER_FEE_FIELD_MAP,
  type FieldConfig,
} from './map';
import type {
  SellerFeeFieldKey,
  ParsedSellerFeeRow,
} from './types';

const fieldMap: Record<string, FieldConfig> = {
  ...SELLER_FEE_FIELD_MAP,
};

export default function parseIncomeSheet(
  rows: unknown[][],
  headers: string[],
  headerRowIndex: number
): ParsedSellerFeeRow[] {
  for (const [key, config] of Object.entries(fieldMap) as [
    SellerFeeFieldKey,
    FieldConfig,
  ][]) {
    let colIdx =
      config.columnIndex ??
      getColIdx(headers, config.header || '');

    if (colIdx === -1) {
      colIdx = headers.findIndex((h) =>
        h.includes(config.header)
      );

      if (colIdx === -1) {
        console.warn(
          `Kolom ${config.header} tidak ditemukan di Laporan Dana Dilepas V2 Sheet "Seller Fee".`
        );
      }
    }

    // indices[key] = colIdx;
    fieldMap[key].columnIndex = colIdx;
  }

  const result: ParsedSellerFeeRow[] = [];
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    // console.log('rows[i]', rows[i]);
    const row = rows[i];

    const parsedRow = {} as ParsedSellerFeeRow;
    for (const [key, config] of Object.entries(
      SELLER_FEE_FIELD_MAP
    ) as [SellerFeeFieldKey, FieldConfig][]) {
      const idx = fieldMap[key].columnIndex;
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
