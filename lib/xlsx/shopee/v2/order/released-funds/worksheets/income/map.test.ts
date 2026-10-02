import { INCOME_FIELD_MAP } from './map';

describe('Shopee released funds v2 date field', () => {
  it('continues to parse date-only text values', () => {
    const date =
      INCOME_FIELD_MAP.releasedFundDate.parser(
        '2026-08-31'
      );

    expect(date).toBeInstanceOf(Date);
    expect(Number.isNaN(date?.getTime())).toBe(false);
  });
});
