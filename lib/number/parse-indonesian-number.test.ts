import { parseMoney } from './money';
import { parseIndonesianNumber } from './parse-indonesian-number';

describe('parseIndonesianNumber', () => {
  it('normalizes Indonesian thousands and decimal separators', () => {
    expect(parseIndonesianNumber('130.000')).toBe(130000);
    expect(parseIndonesianNumber('130,50')).toBe(130.5);
  });

  it('preserves existing fallback behavior for empty and invalid values', () => {
    expect(parseIndonesianNumber(null)).toBe(0);
    expect(parseIndonesianNumber(undefined)).toBe(0);
    expect(parseIndonesianNumber('')).toBe(0);
    expect(parseIndonesianNumber('not a number')).toBe(0);
  });

  it('keeps parseMoney as the same shared conversion', () => {
    expect(parseMoney('130.000')).toBe(
      parseIndonesianNumber('130.000')
    );
  });
});
