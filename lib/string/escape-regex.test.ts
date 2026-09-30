import { escapeRegex } from './escape-regex';

describe('escapeRegex', () => {
  it('treats regular expression metacharacters as literal text', () => {
    const value = 'sku.*+(a)[b]{c}?^$|\\';
    const pattern = new RegExp(`^${escapeRegex(value)}$`);

    expect(pattern.test(value)).toBe(true);
    expect(pattern.test('sku-anything')).toBe(false);
  });
});
