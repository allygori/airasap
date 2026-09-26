import { endOfMonth, startOfMonth } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import type { TimeZone } from '@/constant/timezone';

const getCalendarParts = (
  date: Date,
  timeZone: TimeZone
) => {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError('Tanggal Finance tidak valid.');
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    calendar: 'gregory',
    numberingSystem: 'latn',
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const part = (type: 'year' | 'month' | 'day') =>
    parts.find((item) => item.type === type)?.value ?? '';

  return {
    year: part('year'),
    month: part('month'),
    day: part('day'),
  };
};

export const getFinanceCalendarDate = (
  date: Date,
  timeZone: TimeZone
) => {
  const { year, month, day } = getCalendarParts(
    date,
    timeZone
  );
  return `${year}-${month}-${day}`;
};

export const getFinancePeriodKey = (
  date: Date,
  timeZone: TimeZone
) => {
  const { year, month } = getCalendarParts(date, timeZone);
  return `${year}-${month}`;
};

export const getFinancePeriodBounds = (
  periodKey: string,
  timeZone: TimeZone
) => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodKey)) {
    throw new RangeError('Periode Finance tidak valid.');
  }

  const month = new TZDate(`${periodKey}-01`, timeZone);
  return {
    startDate: new Date(startOfMonth(month)),
    endDate: new Date(endOfMonth(month)),
  };
};
