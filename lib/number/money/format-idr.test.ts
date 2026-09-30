import { formatIDR } from './format-idr';

describe('formatIDR', () => {
  it('formats Indonesian rupiah with no fractional digits', () => {
    const expected = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(1234.56);

    expect(formatIDR(1234.56)).toBe(expected);
  });

  it('can omit the currency symbol', () => {
    const expected = new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(1234.56);

    expect(formatIDR(1234.56, { showSymbol: false })).toBe(
      expected
    );
  });
});
