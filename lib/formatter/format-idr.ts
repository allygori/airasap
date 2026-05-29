type Options = {
  showSymbol?: boolean;
};

export const formatIDR = (
  num: number,
  options: Options = {
    showSymbol: true,
  }
) => {
  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  });

  if (options.showSymbol === false) {
    const filtered = formatter
      .formatToParts(num)
      .filter((part) => part.type !== 'currency')
      .map((part) => part.value)
      .join('')
      .trim();

    return filtered;
  }

  return formatter.format(num);
};
