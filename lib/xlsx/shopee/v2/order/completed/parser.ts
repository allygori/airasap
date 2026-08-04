import { getColIdx } from '@/lib/xlsx/utils';
import { COMPLETED_ORDER_FIELD_MAP } from './map';
import type { CompletedOrderFieldKey } from './types';

const HEADER_DETECTION_KEY = 'No. Pesanan';

type ParsedOrderRow = Record<
  CompletedOrderFieldKey,
  ReturnType<
    (typeof COMPLETED_ORDER_FIELD_MAP)[CompletedOrderFieldKey]['parser']
  >
>;

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
      'Format tidak sesuai: Kolom No. Pesanan tidak ditemukan di Laporan Pesanan.'
    );
  }

  const headers = rows[headerRowIndex].map((h) =>
    String(h).trim()
  );

  const orderIndices = {} as Record<
    CompletedOrderFieldKey,
    number
  >;
  for (const [key, config] of Object.entries(
    COMPLETED_ORDER_FIELD_MAP
  ) as [
    CompletedOrderFieldKey,
    (typeof COMPLETED_ORDER_FIELD_MAP)[CompletedOrderFieldKey],
  ][]) {
    const colIdx = getColIdx(headers, config.header);
    orderIndices[key] = colIdx;
    if (colIdx === -1) {
      console.warn(
        `${config.header} tidak ditemukan di Laporan Pesanan.`
      );
    }
  }

  const orderIdIdx = orderIndices.orderId;
  return rows
    .slice(headerRowIndex + 1)
    .filter((row) => {
      if (!row || row.length === 0) return false;
      if (orderIdIdx === -1) return true;
      return String(row[orderIdIdx] ?? '').trim() !== '';
    })
    .map((row) => {
      const orderData = {} as ParsedOrderRow;
      for (const [key, config] of Object.entries(
        COMPLETED_ORDER_FIELD_MAP
      ) as [
        CompletedOrderFieldKey,
        (typeof COMPLETED_ORDER_FIELD_MAP)[CompletedOrderFieldKey],
      ][]) {
        const idx = orderIndices[key];
        const rawValue = idx !== -1 ? row[idx] : undefined;
        orderData[key] = config.parser(rawValue);
      }
      return orderData;
    });
}
