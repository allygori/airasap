const formatters = new Map<string, Intl.NumberFormat>();

export const getCurrencyFormatter = (currency: string) => {
  let formatter = formatters.get(currency);

  if (!formatter) {
    formatter = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });
    formatters.set(currency, formatter);
  }

  return formatter;
};
