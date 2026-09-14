import { Types } from 'mongoose';
import { aggregateOverviewReport } from './overview-report';

describe('Overview Report', () => {
  const pipeline = aggregateOverviewReport({
    startDate: '2026-09-01',
    endDate: '2026-09-07',
    tenantContext: {
      organizationId: '6a64d53fb427fb66c352640a',
      storeId: '6a64d540b427fb66c352640c',
    },
    filterBy: 'placed_at',
    tz: 'Asia/Jakarta',
  });

  it('filters by tenant, platform, and store-local date range', () => {
    expect(pipeline[0]).toEqual({
      $match: {
        organization: new Types.ObjectId(
          '6a64d53fb427fb66c352640a'
        ),
        store: new Types.ObjectId(
          '6a64d540b427fb66c352640c'
        ),
        platform: 'shopee',
        deleted_at: null,
        placed_at: {
          $gte: new Date('2026-08-31T17:00:00.000Z'),
          $lte: new Date('2026-09-07T16:59:59.999Z'),
        },
      },
    });
  });

  it('exposes funnel, summary, daily, and cancellation facets', () => {
    const facetStage = pipeline.find(
      (stage) => '$facet' in stage
    );

    expect(facetStage).toEqual({
      $facet: expect.objectContaining({
        summary: expect.any(Array),
        funnel: expect.any(Array),
        status_breakdown: expect.any(Array),
        daily_reports: expect.any(Array),
        cancellation_by_actor: expect.any(Array),
        cancellation_by_reason: expect.any(Array),
      }),
    });
  });
});
