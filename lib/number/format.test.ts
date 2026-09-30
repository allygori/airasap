import { formatNumber, formatPercent } from './format';

describe('formatNumber', () => {
  it('formats undefined as zero with one decimal place at most', () => {
    expect(formatNumber(undefined)).toBe(
      new Intl.NumberFormat('id-ID', {
        maximumFractionDigits: 1,
      }).format(0)
    );
  });

  it('uses the requested maximum fraction digits', () => {
    expect(formatNumber(1234.567, 3)).toBe(
      new Intl.NumberFormat('id-ID', {
        maximumFractionDigits: 3,
      }).format(1234.567)
    );
  });
});

describe('formatPercent', () => {
  it('formats ratios as localized percentages with one decimal place at most', () => {
    expect(formatPercent(0.1234)).toBe(
      new Intl.NumberFormat('id-ID', {
        style: 'percent',
        maximumFractionDigits: 1,
      }).format(0.1234)
    );
  });

  it('uses zero for an undefined value', () => {
    expect(formatPercent(undefined)).toBe(
      new Intl.NumberFormat('id-ID', {
        style: 'percent',
        maximumFractionDigits: 1,
      }).format(0)
    );
  });
});
