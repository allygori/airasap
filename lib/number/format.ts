const numberFormatters = new Map<
  number,
  Intl.NumberFormat
>();
const percentFormatters = new Map<
  number,
  Intl.NumberFormat
>();

const getFormatter = (
  style: 'decimal' | 'percent',
  maximumFractionDigits: number
) => {
  const formatters =
    style === 'percent'
      ? percentFormatters
      : numberFormatters;
  let formatter = formatters.get(maximumFractionDigits);

  if (!formatter) {
    formatter = new Intl.NumberFormat('id-ID', {
      style,
      maximumFractionDigits,
    });
    formatters.set(maximumFractionDigits, formatter);
  }

  return formatter;
};

export const formatNumber = (
  value?: number,
  maximumFractionDigits = 1
) =>
  getFormatter('decimal', maximumFractionDigits).format(
    value || 0
  );

export const formatPercent = (
  value?: number,
  maximumFractionDigits = 1
) =>
  getFormatter('percent', maximumFractionDigits).format(
    value || 0
  );
