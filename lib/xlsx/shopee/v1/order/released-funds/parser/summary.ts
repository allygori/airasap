import { parseExcelDate } from '@/lib/date';
import { parseIndonesianNumber } from '@/lib/number';
import { toTrimmedString } from '@/lib/string';

type SummaryMetadata = {
  reportTitle: string;
  sellerUsername: string;
  from: Date | null;
  to: Date | null;
};

type SummaryEntry = {
  rowIndex: number;
  section: string;
  label: string;
  level: number;
  value: string | number | Date | null;
  currency: string;
};

function parseSummaryValue(value: unknown) {
  if (typeof value === 'number')
    return parseIndonesianNumber(value);
  if (value instanceof Date) return value;

  const text = toTrimmedString(value);
  if (!text) return null;

  const date = parseExcelDate('yyyy-MM-dd HH:mm')(text);
  if (date) return date;

  const normalizedNumber = text
    .replace(/\./g, '')
    .replace(/,/g, '.');
  if (/^-?\d+(\.\d+)?$/.test(normalizedNumber)) {
    return parseIndonesianNumber(text);
  }

  return text;
}

export default function parseSummarySheet(
  summaryRows: unknown[][]
) {
  const metadata: SummaryMetadata = {
    reportTitle: '',
    sellerUsername: '',
    from: null,
    to: null,
  };
  const entries: SummaryEntry[] = [];
  let currentSection = '';

  for (let i = 0; i < summaryRows.length; i++) {
    const row = summaryRows[i];
    if (!row || row.length === 0) continue;

    const firstCol = toTrimmedString(row[0]);
    const secondCol = toTrimmedString(row[1]);
    const lastValue =
      row.length > 1 ? row[row.length - 1] : undefined;
    const currency =
      row.some((cell) => toTrimmedString(cell) === 'Rp') ||
      currentSection
        ? 'Rp'
        : '';

    if (i === 0 && firstCol) {
      metadata.reportTitle = firstCol;
      continue;
    }

    if (firstCol === 'Username (Penjual)') {
      metadata.sellerUsername = secondCol;
      continue;
    }

    if (firstCol.toLowerCase() === 'dari') {
      metadata.from = parseExcelDate('yyyy-MM-dd HH:mm')(
        row[1]
      );
      continue;
    }

    if (firstCol.toLowerCase() === 'ke') {
      metadata.to = parseExcelDate('yyyy-MM-dd HH:mm')(
        row[1]
      );
      continue;
    }

    if (firstCol === 'Ringkasan Penghasilan') {
      currentSection = firstCol;
      continue;
    }

    const label = firstCol || secondCol;
    if (!label) continue;

    const valueSource =
      row.length > 1 &&
      lastValue !== undefined &&
      lastValue !== null
        ? lastValue
        : row[2];

    entries.push({
      rowIndex: i,
      section: currentSection,
      label,
      level: firstCol ? 0 : 1,
      value: parseSummaryValue(valueSource),
      currency,
    });
  }

  return {
    metadata,
    entries,
  };
}
