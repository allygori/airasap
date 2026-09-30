import { format } from 'date-fns';
import type { Locale } from 'date-fns';

export const formatDate = (value?: string | Date) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const formatMediumDateInTimeZone = (
  value: string,
  timeZone?: string
) =>
  new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    ...(timeZone ? { timeZone } : {}),
  }).format(new Date(value));

/** Formats a date with the Indonesian medium date style in the runtime timezone. */
export const formatMediumDate = (value: string) =>
  formatMediumDateInTimeZone(value);

/** Formats a date with the Indonesian medium date style in UTC. */
export const formatUtcMediumDate = (value: string) =>
  formatMediumDateInTimeZone(value, 'UTC');

export const fnsFormatDate = (
  value?: string | Date,
  fmt: string = 'yyyy-MM-dd HH:mm',
  locale?: Locale
) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return format(date, fmt, locale ? { locale } : undefined);
};
