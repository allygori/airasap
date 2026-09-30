import { formatCurrency } from './format-currency';

describe('formatCurrency', () => {
  it('formats IDR by default', () => {
    expect(formatCurrency(12345)).toBe(
      new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(12345)
    );
  });

  it('formats a supplied currency code', () => {
    expect(formatCurrency(12345, 'USD')).toBe(
      new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(12345)
    );
  });
});
