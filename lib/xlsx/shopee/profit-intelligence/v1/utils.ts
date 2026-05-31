export const getColIdx = (
  headers: string[],
  name: string
) => {
  return headers.findIndex((h: string) => h === name);
};

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

export const parseDate = (val: unknown): Date | null => {
  if (!val) return null;
  if (
    !(val instanceof Date) &&
    typeof val !== 'string' &&
    typeof val !== 'number'
  )
    return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

export const findValueByLabel = (
  rows: unknown[][],
  label: string
) => {
  for (const row of rows) {
    if (row.includes(label)) {
      return row[row.length - 1];
    }
  }
};

export const extractFields = (
  rows: unknown[][],
  mapping: string
) => {
  const result: Record<string, unknown> = {};

  for (const [key, label] of Object.entries(mapping)) {
    result[key] = findValueByLabel(rows, label as string);
  }

  return result;
};

/**
 * Generate a unique product key combining productId and variationName.
 * Products without variation use productId only.
 */
export const makeProductKey = (
  productId: string,
  variationName?: string
): string => {
  const variation = (variationName || '').trim();
  return variation
    ? `${productId}::${variation}`
    : productId;
};
