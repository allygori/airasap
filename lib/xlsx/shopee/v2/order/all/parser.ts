import { getColIdx } from '@/lib/xlsx/utils';
import { ALL_ORDER_FIELD_MAP } from './map';
import type {
  AllOrderFieldKey,
  ParsedAllOrderRow,
} from './types';

const HEADER_DETECTION_KEY = 'No. Pesanan';

export default function parser(
  rows: unknown[][]
): ParsedAllOrderRow[] {
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    if (rows[i] && rows[i].includes(HEADER_DETECTION_KEY)) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error(
      'Format tidak sesuai: Kolom No. Pesanan tidak ditemukan di file "Laporan Semua Pesanan".'
    );
  }

  const headers = rows[headerRowIndex].map((h) =>
    String(h).trim()
  );

  const orderIndices = {} as Record<
    AllOrderFieldKey,
    number
  >;
  for (const [key, config] of Object.entries(
    ALL_ORDER_FIELD_MAP
  ) as [
    AllOrderFieldKey,
    (typeof ALL_ORDER_FIELD_MAP)[AllOrderFieldKey],
  ][]) {
    const colIdx = getColIdx(headers, config.header);
    orderIndices[key] = colIdx;
    if (colIdx === -1) {
      console.warn(
        `${config.header} tidak ditemukan di file "Laporan Semua Pesanan".`
      );
    }
  }

  const orderIdIdx = orderIndices.id;
  return rows
    .slice(headerRowIndex + 1)
    .filter((row) => {
      if (!row || row.length === 0) return false;
      if (orderIdIdx === -1) return true;
      return String(row[orderIdIdx] ?? '').trim() !== '';
    })
    .map((row) => {
      const orderData = {} as ParsedAllOrderRow;
      for (const [key, config] of Object.entries(
        ALL_ORDER_FIELD_MAP
      ) as [
        AllOrderFieldKey,
        (typeof ALL_ORDER_FIELD_MAP)[AllOrderFieldKey],
      ][]) {
        const idx = orderIndices[key];
        const rawValue = idx !== -1 ? row[idx] : undefined;
        orderData[key] = config.parser(rawValue);
      }
      return orderData;
    });
}
