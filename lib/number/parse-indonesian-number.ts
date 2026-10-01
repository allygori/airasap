export const parseIndonesianNumber = (
  value: unknown
): number => {
  if (value === undefined || value === null || value === '')
    return 0;
  if (typeof value === 'number') return value;

  const clean = String(value)
    .replace(/\./g, '')
    .replace(/,/g, '.');
  return parseFloat(clean) || 0;
};
