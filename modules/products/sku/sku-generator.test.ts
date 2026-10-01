jest.mock('nanoid', () => ({
  customAlphabet: (alphabet: string, size: number) => () =>
    alphabet.slice(0, size),
}));

import SkuGenerator from './sku-generator';

describe('SkuGenerator', () => {
  const generator = new SkuGenerator({ storeCode: 'KD' });

  it('generates a parent SKU with the existing segment format', () => {
    expect(generator.generateParentSKU()).toBe(
      'KD0101-012'
    );
  });

  it('generates a child SKU from the first six parent characters', () => {
    expect(generator.generateChildSKU('KDABCD-EFG')).toBe(
      'KDABCD-012'
    );
  });
});
