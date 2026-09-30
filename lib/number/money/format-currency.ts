import { getCurrencyFormatter } from './currency-formatter';

export const formatCurrency = (
  value: number,
  currency = 'IDR'
) => {
  return getCurrencyFormatter(currency).format(value);
};
