import { parse } from 'date-fns';
import { tz } from '@date-fns/tz';

const DEFAULT_EXCEL_DATE_FORMAT = 'yyyy-MM-dd HH:mm';
const DEFAULT_TIME_ZONE = 'Asia/Jakarta';
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const parseExcelDateValue = (
  value: unknown,
  format: string,
  timeZone: string
): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;

  if (typeof value === 'string') {
    try {
      const parsed = parse(value, format, new Date(0), {
        in: tz(timeZone),
      });

      return Number.isNaN(parsed.getTime())
        ? null
        : new Date(parsed);
    } catch {
      return null;
    }
  }

  if (typeof value === 'number') {
    const date = new Date(
      Date.UTC(1899, 11, 30) + value * MILLISECONDS_PER_DAY
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
};

/**
 * Creates a parser for Excel date values. `timeZone` applies to formatted
 * strings; numeric Excel serial values retain their existing UTC conversion.
 */
export const parseExcelDate = (
  format: string = DEFAULT_EXCEL_DATE_FORMAT,
  timeZone: string = DEFAULT_TIME_ZONE
) => {
  return (value: unknown): Date | null =>
    parseExcelDateValue(value, format, timeZone);
};

export const parseExcelDateToISOString = (
  format: string = DEFAULT_EXCEL_DATE_FORMAT,
  timeZone: string = DEFAULT_TIME_ZONE
) => {
  return (value: unknown): string | null => {
    const date = parseExcelDateValue(
      value,
      format,
      timeZone
    );

    if (!date || Number.isNaN(date.getTime())) return null;
    return date.toISOString();
  };
};
