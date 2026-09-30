import { mergeFilters } from './merge';

describe('mergeFilters', () => {
  it('combines match fields and conditions on the same field', () => {
    const tenantFilter = () => ({
      $match: {
        organization: 'organization-id',
      },
    });
    const placedAtFilter = (
      start: string,
      end: string
    ) => ({
      $match: {
        placed_at: {
          $gte: start,
          $lte: end,
        },
      },
    });

    expect(
      mergeFilters(
        [tenantFilter],
        [placedAtFilter, '2026-10-01', '2026-10-31']
      )
    ).toEqual({
      $match: {
        organization: 'organization-id',
        placed_at: {
          $gte: '2026-10-01',
          $lte: '2026-10-31',
        },
      },
    });
  });
});
