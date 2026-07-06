import { format } from 'date-fns';

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

export const fnsFormatDate = (
  value?: string | Date,
  fmt: string = 'yyyy-MM-dd HH:mm'
) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return format(date, fmt);
};
