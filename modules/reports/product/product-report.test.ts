import { Types } from 'mongoose';
import { aggregateProductSalesReport } from './product-report';
import { endOfDay, parseISO, startOfDay } from 'date-fns';

const ORGANIZATION_ID = '6a64d53fb427fb66c352640a';
const STORE_ID = '6a64d540b427fb66c352640c';

describe('Product Sales Report', () => {
  const startDate = '2026-08-01T00:00:00.000Z';
  const endDate = '2026-09-01T00:00:00.000Z';

  const pipeline = aggregateProductSalesReport({
    startDate,
    endDate,
    tenantContext: {
      organizationId: ORGANIZATION_ID,
      storeId: STORE_ID,
    },
    filterBy: 'placed_at',
    tz: 'Asia/Jakarta',
  });

  it('uses tenant, platform, and sales-report date filters before unwind', () => {
    expect(pipeline[0]).toEqual({
      $match: {
        organization: new Types.ObjectId(ORGANIZATION_ID),
        store: new Types.ObjectId(STORE_ID),
        platform: 'shopee',
        deleted_at: null,
        status: { $in: ['selesai'] },
        placed_at: {
          $gte: startOfDay(parseISO(startDate)),
          $lte: endOfDay(parseISO(endDate)),
        },
        items: { $type: 'array', $ne: [] },
      },
    });

    expect(pipeline[1]).toHaveProperty('$addFields');
    expect(pipeline[2]).toEqual({
      $unwind: {
        path: '$items',
        preserveNullAndEmptyArrays: false,
      },
    });
  });

  it('groups by product variation and counts distinct order ids', () => {
    const groupStage = pipeline.find(
      (stage) => '$group' in stage
    );

    expect(groupStage).toMatchObject({
      $group: {
        _id: {
          product_id: {
            $ifNull: [
              '$_analytics.product_id',
              'unknown-product',
            ],
          },
          variation_id: {
            $ifNull: [
              '$_analytics.variation_id',
              'default',
            ],
          },
        },
        order_ids: { $addToSet: '$_analytics.order_id' },
      },
    });
  });

  it('returns a dashboard-ready shape with summary, products, and meta', () => {
    expect(pipeline.at(-2)).toHaveProperty('$facet');
    expect(pipeline.at(-1)).toEqual({
      $project: expect.objectContaining({
        _id: 0,
        products: 1,
        summary: expect.any(Object),
        meta: expect.any(Object),
      }),
    });
  });
});
