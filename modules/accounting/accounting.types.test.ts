import {
  getAccountingPeriodDateRange,
  getPeriodKeyFromDate,
  parseAccountingCalendarDate,
} from './accounting.types';

describe('accounting calendar helpers', () => {
  it('uses the configured timezone for period boundaries', () => {
    const instant = new Date('2026-08-31T17:00:00.000Z');

    expect(
      getPeriodKeyFromDate(instant, 'Asia/Jakarta')
    ).toBe('2026-09');

    const range = getAccountingPeriodDateRange(
      '2026-09',
      'Asia/Jakarta'
    );
    expect(range.start_date.toISOString()).toBe(
      '2026-08-31T17:00:00.000Z'
    );
    expect(range.end_date.toISOString()).toBe(
      '2026-09-30T16:59:59.999Z'
    );
  });

  it('interprets a calendar date in the accounting timezone', () => {
    expect(
      parseAccountingCalendarDate(
        '2026-09-01',
        'Asia/Makassar',
        'cutover_date'
      ).toISOString()
    ).toBe('2026-08-31T16:00:00.000Z');
  });
});
