import {
  dateParser,
  numberParser,
  stringParser,
} from '../../../utils';

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
  if (typeof value === 'number') return numberParser(value);
  if (value instanceof Date) return value;

  const text = stringParser(value);
  if (!text) return null;

  const date = dateParser(text);
  if (date) return date;

  const normalizedNumber = text
    .replace(/\./g, '')
    .replace(/,/g, '.');
  if (/^-?\d+(\.\d+)?$/.test(normalizedNumber)) {
    return numberParser(text);
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

    const firstCol = stringParser(row[0]);
    const secondCol = stringParser(row[1]);
    const lastValue =
      row.length > 1 ? row[row.length - 1] : undefined;
    const currency =
      row.some((cell) => stringParser(cell) === 'Rp') ||
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
      metadata.from = dateParser(row[1]);
      continue;
    }

    if (firstCol.toLowerCase() === 'ke') {
      metadata.to = dateParser(row[1]);
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
