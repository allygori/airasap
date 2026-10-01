import {
  parseExcelDate,
  parseExcelDateToISOString,
} from './parse-excel-date';

describe('parseExcelDate', () => {
  it('uses Asia/Jakarta by default for formatted date strings', () => {
    expect(
      parseExcelDate('yyyy-MM-dd HH:mm')('2026-06-02 07:18')
    ).toEqual(new Date('2026-06-02T00:18:00.000Z'));
  });

  it('accepts a custom time zone for formatted date strings', () => {
    expect(
      parseExcelDate(
        'yyyy-MM-dd HH:mm',
        'Asia/Makassar'
      )('2026-06-02 07:18')
    ).toEqual(new Date('2026-06-01T23:18:00.000Z'));
    expect(
      parseExcelDateToISOString(
        'yyyy-MM-dd HH:mm',
        'Asia/Makassar'
      )('2026-06-02 07:18')
    ).toBe('2026-06-01T23:18:00.000Z');
  });

  it('preserves the existing numeric serial conversion regardless of time zone', () => {
    const expected = new Date(
      Date.UTC(1899, 11, 30) + 24 * 60 * 60 * 1000
    );

    expect(
      parseExcelDate(undefined, 'Asia/Makassar')(1)
    ).toEqual(expected);
  });

  it('preserves null results for blank and invalid date values', () => {
    expect(parseExcelDate()(null)).toBeNull();
    expect(parseExcelDate()('not a date')).toBeNull();
    expect(
      parseExcelDateToISOString()(new Date('invalid'))
    ).toBeNull();
  });
});
