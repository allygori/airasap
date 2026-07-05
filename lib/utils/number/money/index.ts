export const parseMoney = (val: unknown): number => {
  if (val === undefined || val === null || val === '')
    return 0;
  if (typeof val === 'number') return val;
  // Shopee excel values can be strings with dots like "130.000"
  const clean = String(val)
    .replace(/\./g, '')
    .replace(/,/g, '.');
  return parseFloat(clean) || 0;
};
