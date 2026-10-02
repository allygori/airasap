import { INCOME_FIELD_MAP } from './map';

describe('Shopee released funds v1 date field', () => {
  const parseReleasedFundDate =
    INCOME_FIELD_MAP.releasedFundDate.parser;

  it('parses legacy date-only text values', () => {
    const date = parseReleasedFundDate('2026-04-27');

    expect(date).toBeInstanceOf(Date);
    expect(Number.isNaN(date?.getTime())).toBe(false);
  });

  it('continues to parse date and time text values', () => {
    const date = parseReleasedFundDate('2026-04-27 14:35');

    expect(date).toBeInstanceOf(Date);
    expect(Number.isNaN(date?.getTime())).toBe(false);
  });

  it('continues to parse Excel serial date values', () => {
    const date = parseReleasedFundDate(46000);

    expect(date).toBeInstanceOf(Date);
    expect(Number.isNaN(date?.getTime())).toBe(false);
  });
});
