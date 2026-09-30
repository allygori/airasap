import {
  formatDate,
  fnsFormatDate,
  formatMediumDate,
  formatUtcMediumDate,
} from './format';
import { id } from 'date-fns/locale';

describe('date formatting', () => {
  it('formats dates in the shared Indonesian short-date style', () => {
    const value = '2026-09-30T23:30:00.000Z';
    const expected = new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));

    expect(formatDate(value)).toBe(expected);
    expect(formatDate('invalid')).toBe('-');
  });

  it('formats medium dates in the runtime timezone', () => {
    const value = '2026-09-30T23:30:00.000Z';
    const expected = new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
    }).format(new Date(value));

    expect(formatMediumDate(value)).toBe(expected);
  });

  it('formats medium dates in UTC when explicitly requested', () => {
    expect(
      formatUtcMediumDate('2026-09-30T23:30:00.000Z')
    ).toBe('30 Sep 2026');
  });

  it('supports an explicit date-fns locale for custom date patterns', () => {
    expect(
      fnsFormatDate('2026-08-01', 'd MMMM yyyy', id)
    ).toBe('1 Agustus 2026');
  });
});
