import { getCurrencyFormatter } from './currency-formatter';

type Options = {
  showSymbol?: boolean;
  fallback?: number;
};

const formatter = getCurrencyFormatter('IDR');

export const formatIDR = (
  num: number,
  options: Options = {
    showSymbol: true,
  }
) => {
  if (options.showSymbol === false) {
    const filtered = formatter
      .formatToParts(num)
      .filter((part) => part.type !== 'currency')
      .map((part) => part.value)
      .join('')
      .trim();

    return filtered;
  }

  return num !== undefined && num !== null
    ? formatter.format(num)
    : Number.isFinite(options.fallback)
      ? formatter.format(Number(options.fallback))
      : '-';
};
