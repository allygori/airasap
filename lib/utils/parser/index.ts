export const stringParser = (val: unknown): string => {
  if (val === undefined || val === null) return '';
  return String(val).trim();
};

export const numberParser = (val: unknown): number => {
  if (val === undefined || val === null || val === '')
    return 0;
  if (typeof val === 'number') return val;
  // Shopee excel values can be strings with dots/commas like "130.000" or "130,00"
  const clean = String(val)
    .replace(/\./g, '')
    .replace(/,/g, '.');
  return parseFloat(clean) || 0;
};

export const dateParser = (val: unknown): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

// usage: booleanParser('TRUE', 'FALSE)
export const booleanParser = (
  trueVal: string,
  falseVal: string
) => {
  return (val: unknown): boolean => {
    const s = stringParser(val).toLowerCase();

    if (s === trueVal.toLowerCase()) return true;
    if (s === falseVal.toLowerCase()) return false;
    return false;
  };
};
