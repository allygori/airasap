export const round = (
  value: number | undefined,
  precision = 2
) => {
  if (value === undefined) {
    return null;
  }

  if (Number.isNaN(value)) {
    return null;
  }

  // return Number(Math.round(!!precision ? value + 'e' + precision : value) + 'e-' + precision);

  const scaledValue = precision
    ? Number(value + 'e' + precision)
    : value;

  return Number(Math.round(scaledValue) + 'e-' + precision);
};
