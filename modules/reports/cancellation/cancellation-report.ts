import { ORDER_PLATFORMS } from '@/constant/order-platform';
import { SHOPEE_ORDER_STATUS } from '@/constant/order/shopee/status';
import { type TimeZone } from '@/constant/timezone';
import { getReportDateRange } from '@/lib/utils/date/report-range';
import { AggregateBuilder } from '@/modules/reports/@shared/aggregate/builder';
import { differenceInCalendarDays } from 'date-fns';
import { Types, type PipelineStage } from 'mongoose';

const cancelledStatus = SHOPEE_ORDER_STATUS.cancelled.value;

const tzMap: Record<TimeZone, string> = {
  'Asia/Jakarta': '+07:00',
  'Asia/Makassar': '+08:00',
  'Asia/Jayapura': '+09:00',
};

type Args = {
  startDate: string;
  endDate: string;
  tenantContext: {
    organizationId: string;
    storeId: string;
  };
  tz: TimeZone;
};

export const aggregateCancellationReport = ({
  startDate,
  endDate,
  tenantContext,
  tz,
}: Args): PipelineStage[] => {
  const dateRange = getReportDateRange(
    startDate,
    endDate,
    tz
  );
  const periodDays = Math.max(
    1,
    differenceInCalendarDays(
      dateRange.endDate,
      dateRange.startDate
    ) + 1
  );

  return new AggregateBuilder()
    .with({
      $match: {
        organization: new Types.ObjectId(
          tenantContext.organizationId
        ),
        store: new Types.ObjectId(tenantContext.storeId),
        platform: ORDER_PLATFORMS.shopee.value,
        deleted_at: null,
        placed_at: {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate,
        },
      },
    })
    .with(normalizeCancellationOrder(tz))
    .with({
      $facet: {
        summary: summaryPipeline(),
        daily_reports: dailyReportsPipeline(),
        cancellation_by_actor:
          breakdownPipeline('cancelled_by'),
        cancellation_by_reason: breakdownPipeline(
          'cancellation_reason'
        ),
        data_quality: dataQualityPipeline(),
      },
    })
    .with({
      $project: {
        _id: 0,
        summary: {
          $ifNull: [
            { $arrayElemAt: ['$summary', 0] },
            emptySummary(),
          ],
        },
        daily_reports: 1,
        cancellation_by_actor: 1,
        cancellation_by_reason: 1,
        data_quality: {
          $ifNull: [
            { $arrayElemAt: ['$data_quality', 0] },
            emptyDataQuality(),
          ],
        },
        meta: {
          start_date: startDate,
          end_date: endDate,
          period_days: periodDays,
        },
      },
    })
    .build();
};

const normalizeCancellationOrder = (
  timezone: TimeZone
): PipelineStage.AddFields => ({
  $addFields: {
    _cancellation: {
      status: { $ifNull: ['$status', 'unknown'] },
      order_date_local: {
        $dateToString: {
          format: '%Y-%m-%d',
          date: '$placed_at',
          timezone: tzMap[timezone],
        },
      },
      is_cancelled: { $eq: ['$status', cancelledStatus] },
      cancelled_by: {
        $ifNull: ['$cancelled_by', 'unknown'],
      },
      cancellation_reason: {
        $ifNull: ['$cancellation_reason', 'Unknown'],
      },
      gross_sales: {
        $ifNull: [
          '$total_gross_sales',
          '$order_subtotal',
          0,
        ],
      },
      total_payment: { $ifNull: ['$total_payment', 0] },
      cogs: { $ifNull: ['$total_product_cost', 0] },
      gross_profit: {
        $ifNull: [
          '$total_gross_profit',
          {
            $subtract: [
              {
                $ifNull: [
                  '$total_gross_sales',
                  '$order_subtotal',
                  0,
                ],
              },
              { $ifNull: ['$total_product_cost', 0] },
            ],
          },
        ],
      },
      net_profit: {
        $ifNull: [
          '$total_net_profit',
          {
            $subtract: [
              { $ifNull: ['$released_funds', 0] },
              { $ifNull: ['$total_product_cost', 0] },
            ],
          },
        ],
      },
      seller_discount: {
        $add: [
          { $ifNull: ['$voucher_borne_by_seller', 0] },
          {
            $ifNull: [
              '$bundle_deal_discount_from_seller',
              0,
            ],
          },
        ],
      },
      shopee_discount: {
        $add: [
          { $ifNull: ['$voucher_borne_by_shopee', 0] },
          {
            $ifNull: [
              '$bundle_deal_discount_from_shopee',
              0,
            ],
          },
        ],
      },
      units: {
        $sum: {
          $map: {
            input: { $ifNull: ['$items', []] },
            as: 'item',
            in: {
              $ifNull: [
                '$$item.final_quantity',
                '$$item.quantity',
                0,
              ],
            },
          },
        },
      },
    },
  },
});

const summaryPipeline =
  (): PipelineStage.FacetPipelineStage[] => [
    {
      $group: {
        _id: null,
        total_orders: { $sum: 1 },
        cancelled_orders: {
          $sum: {
            $cond: ['$_cancellation.is_cancelled', 1, 0],
          },
        },
        potential_gross_sales: {
          $sum: '$_cancellation.gross_sales',
        },
        cancelled_gross_sales: {
          $sum: {
            $cond: [
              '$_cancellation.is_cancelled',
              '$_cancellation.gross_sales',
              0,
            ],
          },
        },
        cancelled_payment: {
          $sum: {
            $cond: [
              '$_cancellation.is_cancelled',
              '$_cancellation.total_payment',
              0,
            ],
          },
        },
        cancelled_cogs: {
          $sum: {
            $cond: [
              '$_cancellation.is_cancelled',
              '$_cancellation.cogs',
              0,
            ],
          },
        },
        cancelled_gross_profit: {
          $sum: {
            $cond: [
              '$_cancellation.is_cancelled',
              '$_cancellation.gross_profit',
              0,
            ],
          },
        },
        cancelled_net_profit: {
          $sum: {
            $cond: [
              '$_cancellation.is_cancelled',
              '$_cancellation.net_profit',
              0,
            ],
          },
        },
        cancelled_seller_discount: {
          $sum: {
            $cond: [
              '$_cancellation.is_cancelled',
              '$_cancellation.seller_discount',
              0,
            ],
          },
        },
        cancelled_shopee_discount: {
          $sum: {
            $cond: [
              '$_cancellation.is_cancelled',
              '$_cancellation.shopee_discount',
              0,
            ],
          },
        },
        cancelled_units: {
          $sum: {
            $cond: [
              '$_cancellation.is_cancelled',
              '$_cancellation.units',
              0,
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        total_orders: 1,
        cancelled_orders: 1,
        potential_gross_sales: 1,
        cancelled_gross_sales: 1,
        cancelled_payment: 1,
        cancelled_cogs: 1,
        cancelled_gross_profit: 1,
        cancelled_net_profit: 1,
        cancelled_seller_discount: 1,
        cancelled_shopee_discount: 1,
        cancelled_units: 1,
        non_cancelled_orders: {
          $subtract: ['$total_orders', '$cancelled_orders'],
        },
        cancellation_rate_by_orders: ratio(
          '$cancelled_orders',
          '$total_orders'
        ),
        cancellation_rate_by_value: ratio(
          '$cancelled_gross_sales',
          '$potential_gross_sales'
        ),
        average_cancelled_order_value: ratio(
          '$cancelled_gross_sales',
          '$cancelled_orders'
        ),
      },
    },
  ];

const dailyReportsPipeline =
  (): PipelineStage.FacetPipelineStage[] => [
    {
      $group: {
        _id: '$_cancellation.order_date_local',
        orders: { $sum: 1 },
        cancelled_orders: {
          $sum: {
            $cond: ['$_cancellation.is_cancelled', 1, 0],
          },
        },
        potential_gross_sales: {
          $sum: '$_cancellation.gross_sales',
        },
        cancelled_gross_sales: {
          $sum: {
            $cond: [
              '$_cancellation.is_cancelled',
              '$_cancellation.gross_sales',
              0,
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        orders: 1,
        cancelled_orders: 1,
        potential_gross_sales: 1,
        cancelled_gross_sales: 1,
        cancellation_rate: ratio(
          '$cancelled_orders',
          '$orders'
        ),
        cancellation_rate_by_value: ratio(
          '$cancelled_gross_sales',
          '$potential_gross_sales'
        ),
      },
    },
    { $sort: { date: 1 } },
  ];

const breakdownPipeline = (
  field: 'cancelled_by' | 'cancellation_reason'
): PipelineStage.FacetPipelineStage[] => [
  { $match: { '_cancellation.is_cancelled': true } },
  {
    $group: {
      _id: `$_cancellation.${field}`,
      orders: { $sum: 1 },
      cancelled_gross_sales: {
        $sum: '$_cancellation.gross_sales',
      },
      cancelled_payment: {
        $sum: '$_cancellation.total_payment',
      },
    },
  },
  {
    $project: {
      _id: 0,
      label: { $ifNull: ['$_id', 'Unknown'] },
      orders: 1,
      cancelled_gross_sales: 1,
      cancelled_payment: 1,
    },
  },
  { $sort: { cancelled_gross_sales: -1 } },
];

const dataQualityPipeline =
  (): PipelineStage.FacetPipelineStage[] => [
    {
      $group: {
        _id: null,
        cancelled_orders: {
          $sum: {
            $cond: ['$_cancellation.is_cancelled', 1, 0],
          },
        },
        orders_with_reason: {
          $sum: {
            $cond: [
              {
                $and: [
                  '$_cancellation.is_cancelled',
                  {
                    $ne: [
                      '$_cancellation.cancellation_reason',
                      'Unknown',
                    ],
                  },
                ],
              },
              1,
              0,
            ],
          },
        },
        orders_with_actor: {
          $sum: {
            $cond: [
              {
                $and: [
                  '$_cancellation.is_cancelled',
                  {
                    $ne: [
                      '$_cancellation.cancelled_by',
                      'unknown',
                    ],
                  },
                ],
              },
              1,
              0,
            ],
          },
        },
        orders_with_gross_sales: {
          $sum: {
            $cond: [
              {
                $and: [
                  '$_cancellation.is_cancelled',
                  { $ne: ['$total_gross_sales', null] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        cancelled_orders: 1,
        orders_with_reason: 1,
        orders_with_actor: 1,
        orders_with_gross_sales: 1,
        reason_coverage: ratio(
          '$orders_with_reason',
          '$cancelled_orders'
        ),
        actor_coverage: ratio(
          '$orders_with_actor',
          '$cancelled_orders'
        ),
        gross_sales_coverage: ratio(
          '$orders_with_gross_sales',
          '$cancelled_orders'
        ),
      },
    },
  ];

const ratio = (numerator: string, denominator: string) => ({
  $cond: [
    { $gt: [denominator, 0] },
    { $divide: [numerator, denominator] },
    0,
  ],
});

const emptySummary = () => ({
  total_orders: 0,
  cancelled_orders: 0,
  non_cancelled_orders: 0,
  potential_gross_sales: 0,
  cancelled_gross_sales: 0,
  cancelled_payment: 0,
  cancelled_cogs: 0,
  cancelled_gross_profit: 0,
  cancelled_net_profit: 0,
  cancelled_seller_discount: 0,
  cancelled_shopee_discount: 0,
  cancelled_units: 0,
  cancellation_rate_by_orders: 0,
  cancellation_rate_by_value: 0,
  average_cancelled_order_value: 0,
});

const emptyDataQuality = () => ({
  cancelled_orders: 0,
  orders_with_reason: 0,
  orders_with_actor: 0,
  orders_with_gross_sales: 0,
  reason_coverage: 0,
  actor_coverage: 0,
  gross_sales_coverage: 0,
});
