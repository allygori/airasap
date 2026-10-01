import { toTrimmedString } from './to-trimmed-string';

describe('toTrimmedString', () => {
  it('converts values to trimmed strings and maps nullish values to empty', () => {
    expect(toTrimmedString('  Shopee  ')).toBe('Shopee');
    expect(toTrimmedString(123)).toBe('123');
    expect(toTrimmedString(null)).toBe('');
    expect(toTrimmedString(undefined)).toBe('');
  });
});
