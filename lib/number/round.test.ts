import { round } from './index';

describe('round', () => {
  it('rounds with the requested decimal precision', () => {
    expect(round(1.005)).toBe(1.01);
    expect(round(1.236, 2)).toBe(1.24);
    expect(round(1.6, 0)).toBe(2);
  });

  it('returns null for an absent or NaN value', () => {
    expect(round(undefined)).toBeNull();
    expect(round(Number.NaN)).toBeNull();
  });
});
