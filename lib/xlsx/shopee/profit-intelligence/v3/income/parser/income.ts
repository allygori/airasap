import { getColIdx } from '../../utils';
import {
  INCOME_FIELD_MAP,
  type FieldConfig,
  type IncomeFieldKey,
} from '../map';

const HEADER_DETECTION_KEY = 'No. Pesanan';

type ParsedIncomeRow = Record<
  IncomeFieldKey,
  ReturnType<
    (typeof INCOME_FIELD_MAP)[IncomeFieldKey]['parser']
  >
>;

export default function parseIncomeSheet(
  incomeData: unknown[][]
): ParsedIncomeRow[] {
  let headerRowIndex = -1;
  for (
    let i = 0;
    i < Math.min(incomeData.length, 10);
    i++
  ) {
    if (
      incomeData[i] &&
      incomeData[i].includes(HEADER_DETECTION_KEY)
    ) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error(
      'Kolom No. Pesanan tidak ditemukan di Laporan Penghasilan.'
    );
  }

  const headers = incomeData[headerRowIndex].map((header) =>
    String(header).trim()
  );
  const indices = {} as Record<IncomeFieldKey, number>;

  for (const [key, config] of Object.entries(
    INCOME_FIELD_MAP
  ) as [IncomeFieldKey, FieldConfig][]) {
    const colIdx =
      config.columnIndex ??
      getColIdx(headers, config.header || '');
    indices[key] = colIdx;

    if (colIdx === -1) {
      console.warn(
        `${config.header} tidak ditemukan di Laporan Penghasilan.`
      );
    }
  }

  const noOrderIdx = indices.noOrder;
  return incomeData
    .slice(headerRowIndex + 1)
    .filter((row) => {
      if (!row || row.length === 0) return false;
      if (noOrderIdx === -1) return true;
      return String(row[noOrderIdx] ?? '').trim() !== '';
    })
    .map((row) => {
      const incomeRow = {} as ParsedIncomeRow;
      for (const [key, config] of Object.entries(
        INCOME_FIELD_MAP
      ) as [IncomeFieldKey, FieldConfig][]) {
        const idx = indices[key];
        const rawValue = idx !== -1 ? row[idx] : undefined;
        incomeRow[key] = config.parser(rawValue);
      }
      return incomeRow;
    });
}
