import { normalizeFinanceState } from './finance.types';

describe('normalizeFinanceState', () => {
  it('returns a not-started state when finance is missing', () => {
    expect(normalizeFinanceState()).toEqual({
      status: 'not_started',
      onboarding_version: 1,
      calendar_timezone: 'Asia/Jakarta',
    });
  });

  it('preserves an existing finance lifecycle state', () => {
    const startedAt = new Date('2026-09-22T00:00:00.000Z');

    expect(
      normalizeFinanceState({
        status: 'in_progress',
        onboarding_version: 2,
        calendar_timezone: 'Asia/Jakarta',
        started_at: startedAt,
      })
    ).toEqual({
      status: 'in_progress',
      onboarding_version: 2,
      calendar_timezone: 'Asia/Jakarta',
      started_at: startedAt,
    });
  });
});
