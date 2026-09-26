import {
  getFinanceCalendarDate,
  getFinancePeriodBounds,
  getFinancePeriodKey,
} from './finance-calendar';

describe('Finance calendar', () => {
  it('assigns a journal to the month in the organization timezone', () => {
    expect(
      getFinancePeriodKey(
        new Date('2026-09-30T16:59:59.999Z'),
        'Asia/Jakarta'
      )
    ).toBe('2026-09');
    expect(
      getFinancePeriodKey(
        new Date('2026-09-30T17:00:00.000Z'),
        'Asia/Jakarta'
      )
    ).toBe('2026-10');
  });

  it('uses the selected timezone for business-date values', () => {
    const instant = new Date('2026-09-30T16:30:00.000Z');

    expect(
      getFinanceCalendarDate(instant, 'Asia/Jakarta')
    ).toBe('2026-09-30');
    expect(
      getFinanceCalendarDate(instant, 'Asia/Makassar')
    ).toBe('2026-10-01');
    expect(
      getFinanceCalendarDate(instant, 'Asia/Jayapura')
    ).toBe('2026-10-01');
    expect(
      getFinancePeriodKey(instant, 'Asia/Jakarta')
    ).toBe('2026-09');
    expect(
      getFinancePeriodKey(instant, 'Asia/Makassar')
    ).toBe('2026-10');
  });

  it('builds inclusive UTC bounds for a local calendar month', () => {
    expect(
      getFinancePeriodBounds('2026-09', 'Asia/Jakarta')
    ).toEqual({
      startDate: new Date('2026-08-31T17:00:00.000Z'),
      endDate: new Date('2026-09-30T16:59:59.999Z'),
    });
  });

  it('rejects an invalid month key', () => {
    expect(() =>
      getFinancePeriodBounds('2026-13', 'Asia/Jakarta')
    ).toThrow('Periode Finance tidak valid.');
  });
});
