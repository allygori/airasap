import { ORDER_PLATFORMS } from '@/constant/order-platform';
import { SHOPEE_ORDER_STATUS } from '@/constant/order/shopee/status';
import { type TimeZone } from '@/constant/timezone';
import { getReportDateRange } from '@/lib/utils/date/report-range';
import { AggregateBuilder } from '@/modules/reports/@shared/aggregate/builder';
import { differenceInCalendarDays } from 'date-fns';
import { Types, type PipelineStage } from 'mongoose';

const DEFAULT_DATE_FIELD = 'placed_at';

const completedStatus = SHOPEE_ORDER_STATUS.completed.value;
const cancelledStatus = SHOPEE_ORDER_STATUS.cancelled.value;
const returnRefundStatuses = [
  SHOPEE_ORDER_STATUS.return.value,
  SHOPEE_ORDER_STATUS.refund.value,
];
const inProgressStatuses = [
  SHOPEE_ORDER_STATUS.needsToBeShipped.value,
  SHOPEE_ORDER_STATUS.toShip.value,
  SHOPEE_ORDER_STATUS.toReceive.value,
];

type Args = {
  filterBy?: 'placed_at' | 'completed_at' | 'paid_at';
  startDate: string;
  endDate: string;
  tenantContext: {
    organizationId: string;
    storeId: string;
  };
  tz: TimeZone;
};

const tzMap: Record<TimeZone, string> = {
  'Asia/Jakarta': '+07:00',
  'Asia/Makassar': '+08:00',
  'Asia/Jayapura': '+09:00',
};

export const aggregateOverviewReport = ({
  filterBy = DEFAULT_DATE_FIELD,
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
        [filterBy]: {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate,
        },
      },
    })
    .with(normalizeOverviewOrder(filterBy, tz))
    .with({
      $facet: {
        summary: summaryPipeline(),
        funnel: funnelPipeline(),
        status_breakdown: statusBreakdownPipeline(),
        daily_reports: dailyReportsPipeline(),
        cancellation_by_actor:
          cancellationByActorPipeline(),
        cancellation_by_reason:
          cancellationByReasonPipeline(),
      },
    })
    .with({
      $project: {
        _id: 0,
        summary: {
          $ifNull: [
            { $arrayElemAt: ['$summary', 0] },
            emptyOverviewSummary(),
          ],
        },
        funnel: 1,
        status_breakdown: 1,
        daily_reports: 1,
        cancellation_by_actor: 1,
        cancellation_by_reason: 1,
        meta: {
          start_date: startDate,
          end_date: endDate,
          period_days: periodDays,
        },
      },
    })
    .build();
};

const normalizeOverviewOrder = <F extends string>(
  field: F,
  timezone: TimeZone
): PipelineStage.AddFields => ({
  $addFields: {
    _overview: {
      status: { $ifNull: ['$status', 'unknown'] },
      order_date_local: {
        $dateToString: {
          format: '%Y-%m-%d',
          date: `$${field}`,
          timezone: tzMap[timezone],
        },
      },
      username: '$username',
      potential_gross_sales: {
        $ifNull: [
          '$total_gross_sales',
          '$order_subtotal',
          0,
        ],
      },
      net_sales: {
        $ifNull: ['$total_net_sales', '$order_subtotal', 0],
      },
      total_payment: { $ifNull: ['$total_payment', 0] },
      released_funds: { $ifNull: ['$released_funds', 0] },
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
      seller_voucher: {
        $ifNull: ['$voucher_borne_by_seller', 0],
      },
      seller_bundle_discount: {
        $ifNull: ['$bundle_deal_discount_from_seller', 0],
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
      shopee_voucher: {
        $ifNull: ['$voucher_borne_by_shopee', 0],
      },
      shopee_bundle_discount: {
        $ifNull: ['$bundle_deal_discount_from_shopee', 0],
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
      shopee_fee: feeTotalExpression(),
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
      item_count: { $size: { $ifNull: ['$items', []] } },
      is_completed: { $eq: ['$status', completedStatus] },
      is_cancelled: { $eq: ['$status', cancelledStatus] },
      is_return_refund: {
        $in: ['$status', returnRefundStatuses],
      },
      is_in_progress: {
        $in: ['$status', inProgressStatuses],
      },
      status_bucket: {
        $switch: {
          branches: [
            {
              case: { $eq: ['$status', completedStatus] },
              then: 'completed',
            },
            {
              case: { $eq: ['$status', cancelledStatus] },
              then: 'cancelled',
            },
            {
              case: {
                $in: ['$status', returnRefundStatuses],
              },
              then: 'return_refund',
            },
            {
              case: {
                $in: ['$status', inProgressStatuses],
              },
              then: 'in_progress',
            },
          ],
          default: 'other',
        },
      },
      cancelled_by: {
        $ifNull: ['$cancelled_by', 'unknown'],
      },
      cancellation_reason: {
        $ifNull: ['$cancellation_reason', 'Unknown'],
      },
      voucher_code: { $ifNull: ['$voucher_code', null] },
    },
  },
});

const feeTotalExpression = () => ({
  $abs: {
    $add: [
      { $ifNull: ['$fee.admin_fee', 0] },
      { $ifNull: ['$fee.processing_fee', 0] },
      { $ifNull: ['$fee.affiliate_fee', 0] },
      { $ifNull: ['$fee.gox_fee', 0] },
      { $ifNull: ['$fee.service_fee', 0] },
      { $ifNull: ['$fee.transaction_fee', 0] },
      { $ifNull: ['$fee.campaign_fee', 0] },
      { $ifNull: ['$fee.shipping_saver_program_fee', 0] },
      { $ifNull: ['$fee.other_fee', 0] },
      { $ifNull: ['$fee.premium_fee', 0] },
      { $ifNull: ['$fee.fbs_fee', 0] },
      { $ifNull: ['$fee.tax_pph22', 0] },
      { $ifNull: ['$fee.import_duty_vat_income_tax', 0] },
      { $ifNull: ['$fee.auto_top_up_fee_from_income', 0] },
      { $ifNull: ['$fee.return_shipping_fee', 0] },
      {
        $ifNull: ['$fee.return_to_sender_shipping_fee', 0],
      },
      { $ifNull: ['$fee.shipping_fee_refund', 0] },
    ],
  },
});

const summaryPipeline =
  (): PipelineStage.FacetPipelineStage[] => [
    {
      $group: {
        _id: null,
        potential_gross_sales: {
          $sum: '$_overview.potential_gross_sales',
        },
        realized_gross_sales: {
          $sum: {
            $cond: [
              '$_overview.is_completed',
              '$_overview.potential_gross_sales',
              0,
            ],
          },
        },
        cancelled_gross_sales: {
          $sum: {
            $cond: [
              '$_overview.is_cancelled',
              '$_overview.potential_gross_sales',
              0,
            ],
          },
        },
        in_progress_gross_sales: {
          $sum: {
            $cond: [
              '$_overview.is_in_progress',
              '$_overview.potential_gross_sales',
              0,
            ],
          },
        },
        return_refund_gross_sales: {
          $sum: {
            $cond: [
              '$_overview.is_return_refund',
              '$_overview.potential_gross_sales',
              0,
            ],
          },
        },
        net_sales: {
          $sum: {
            $cond: [
              '$_overview.is_completed',
              '$_overview.net_sales',
              0,
            ],
          },
        },
        total_payment: {
          $sum: {
            $cond: [
              '$_overview.is_completed',
              '$_overview.total_payment',
              0,
            ],
          },
        },
        released_funds: {
          $sum: {
            $cond: [
              '$_overview.is_completed',
              '$_overview.released_funds',
              0,
            ],
          },
        },
        cogs: {
          $sum: {
            $cond: [
              '$_overview.is_completed',
              '$_overview.cogs',
              0,
            ],
          },
        },
        gross_profit: {
          $sum: {
            $cond: [
              '$_overview.is_completed',
              '$_overview.gross_profit',
              0,
            ],
          },
        },
        net_profit: {
          $sum: {
            $cond: [
              '$_overview.is_completed',
              '$_overview.net_profit',
              0,
            ],
          },
        },
        seller_voucher: {
          $sum: {
            $cond: [
              '$_overview.is_completed',
              '$_overview.seller_voucher',
              0,
            ],
          },
        },
        seller_bundle_discount: {
          $sum: {
            $cond: [
              '$_overview.is_completed',
              '$_overview.seller_bundle_discount',
              0,
            ],
          },
        },
        seller_discount: {
          $sum: {
            $cond: [
              '$_overview.is_completed',
              '$_overview.seller_discount',
              0,
            ],
          },
        },
        shopee_voucher: {
          $sum: {
            $cond: [
              '$_overview.is_completed',
              '$_overview.shopee_voucher',
              0,
            ],
          },
        },
        shopee_bundle_discount: {
          $sum: {
            $cond: [
              '$_overview.is_completed',
              '$_overview.shopee_bundle_discount',
              0,
            ],
          },
        },
        shopee_discount: {
          $sum: {
            $cond: [
              '$_overview.is_completed',
              '$_overview.shopee_discount',
              0,
            ],
          },
        },
        shopee_fee: {
          $sum: {
            $cond: [
              '$_overview.is_completed',
              '$_overview.shopee_fee',
              0,
            ],
          },
        },
        total_orders: { $sum: 1 },
        completed_orders: {
          $sum: {
            $cond: ['$_overview.is_completed', 1, 0],
          },
        },
        cancelled_orders: {
          $sum: {
            $cond: ['$_overview.is_cancelled', 1, 0],
          },
        },
        in_progress_orders: {
          $sum: {
            $cond: ['$_overview.is_in_progress', 1, 0],
          },
        },
        return_refund_orders: {
          $sum: {
            $cond: ['$_overview.is_return_refund', 1, 0],
          },
        },
        total_units: { $sum: '$_overview.units' },
        completed_units: {
          $sum: {
            $cond: [
              '$_overview.is_completed',
              '$_overview.units',
              0,
            ],
          },
        },
        total_items: { $sum: '$_overview.item_count' },
        completed_items: {
          $sum: {
            $cond: [
              '$_overview.is_completed',
              '$_overview.item_count',
              0,
            ],
          },
        },
        buyers: { $addToSet: '$_overview.username' },
        completed_buyers: {
          $addToSet: {
            $cond: [
              '$_overview.is_completed',
              '$_overview.username',
              '$$REMOVE',
            ],
          },
        },
        voucher_codes: {
          $addToSet: {
            $cond: [
              { $ne: ['$_overview.voucher_code', null] },
              '$_overview.voucher_code',
              '$$REMOVE',
            ],
          },
        },
        has_net_sales: {
          $sum: {
            $cond: [
              { $ne: ['$total_net_sales', null] },
              1,
              0,
            ],
          },
        },
        has_net_profit: {
          $sum: {
            $cond: [
              { $ne: ['$total_net_profit', null] },
              1,
              0,
            ],
          },
        },
        has_released_funds: {
          $sum: {
            $cond: [
              { $ne: ['$released_funds', null] },
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
        potential_gross_sales: 1,
        realized_gross_sales: 1,
        cancelled_gross_sales: 1,
        in_progress_gross_sales: 1,
        return_refund_gross_sales: 1,
        net_sales: 1,
        total_payment: 1,
        released_funds: 1,
        cogs: 1,
        gross_profit: 1,
        net_profit: 1,
        seller_voucher: 1,
        seller_bundle_discount: 1,
        seller_discount: 1,
        shopee_voucher: 1,
        shopee_bundle_discount: 1,
        shopee_discount: 1,
        shopee_fee: 1,
        marketplace_deduction: {
          $max: [
            {
              $subtract: [
                '$realized_gross_sales',
                '$net_sales',
              ],
            },
            0,
          ],
        },
        total_discount: {
          $add: ['$seller_discount', '$shopee_discount'],
        },
        total_units: 1,
        completed_units: 1,
        total_items: 1,
        completed_items: 1,
        total_orders: 1,
        completed_orders: 1,
        cancelled_orders: 1,
        in_progress_orders: 1,
        return_refund_orders: 1,
        total_buyers: { $size: '$buyers' },
        completed_buyers: { $size: '$completed_buyers' },
        voucher_codes: 1,
        average_order_value: ratio(
          '$total_payment',
          '$completed_orders'
        ),
        profit_per_order: ratio(
          '$net_profit',
          '$completed_orders'
        ),
        gross_margin: ratio(
          '$gross_profit',
          '$realized_gross_sales'
        ),
        net_margin: ratio('$net_profit', '$net_sales'),
        fee_ratio: ratio(
          '$shopee_fee',
          '$realized_gross_sales'
        ),
        seller_discount_ratio: ratio(
          '$seller_discount',
          '$realized_gross_sales'
        ),
        shopee_discount_ratio: ratio(
          '$shopee_discount',
          '$realized_gross_sales'
        ),
        net_sales_coverage: ratio(
          '$has_net_sales',
          '$completed_orders'
        ),
        net_profit_coverage: ratio(
          '$has_net_profit',
          '$completed_orders'
        ),
        released_funds_coverage: ratio(
          '$has_released_funds',
          '$completed_orders'
        ),
        cancellation_rate_by_orders: ratio(
          '$cancelled_orders',
          '$total_orders'
        ),
        cancellation_rate_by_value: ratio(
          '$cancelled_gross_sales',
          '$potential_gross_sales'
        ),
        sales_realization_rate: ratio(
          '$realized_gross_sales',
          '$potential_gross_sales'
        ),
      },
    },
  ];

const funnelPipeline =
  (): PipelineStage.FacetPipelineStage[] => [
    {
      $group: {
        _id: '$_overview.status_bucket',
        orders: { $sum: 1 },
        gross_sales: {
          $sum: '$_overview.potential_gross_sales',
        },
        total_payment: { $sum: '$_overview.total_payment' },
        units: { $sum: '$_overview.units' },
      },
    },
    {
      $project: {
        _id: 0,
        bucket: '$_id',
        orders: 1,
        gross_sales: 1,
        total_payment: 1,
        units: 1,
      },
    },
    { $sort: { gross_sales: -1 } },
  ];

const statusBreakdownPipeline =
  (): PipelineStage.FacetPipelineStage[] => [
    {
      $group: {
        _id: '$_overview.status',
        orders: { $sum: 1 },
        gross_sales: {
          $sum: '$_overview.potential_gross_sales',
        },
        total_payment: { $sum: '$_overview.total_payment' },
      },
    },
    {
      $project: {
        _id: 0,
        status: { $ifNull: ['$_id', 'unknown'] },
        orders: 1,
        gross_sales: 1,
        total_payment: 1,
      },
    },
    { $sort: { gross_sales: -1 } },
  ];

const dailyReportsPipeline =
  (): PipelineStage.FacetPipelineStage[] => [
    {
      $group: {
        _id: '$_overview.order_date_local',
        orders: { $sum: 1 },
        potential_gross_sales: {
          $sum: '$_overview.potential_gross_sales',
        },
        cancelled_orders: {
          $sum: {
            $cond: ['$_overview.is_cancelled', 1, 0],
          },
        },
        cancelled_gross_sales: {
          $sum: {
            $cond: [
              '$_overview.is_cancelled',
              '$_overview.potential_gross_sales',
              0,
            ],
          },
        },
        completed_orders: {
          $sum: {
            $cond: ['$_overview.is_completed', 1, 0],
          },
        },
        realized_gross_sales: {
          $sum: {
            $cond: [
              '$_overview.is_completed',
              '$_overview.potential_gross_sales',
              0,
            ],
          },
        },
        net_sales: {
          $sum: {
            $cond: [
              '$_overview.is_completed',
              '$_overview.net_sales',
              0,
            ],
          },
        },
        net_profit: {
          $sum: {
            $cond: [
              '$_overview.is_completed',
              '$_overview.net_profit',
              0,
            ],
          },
        },
        shopee_fee: {
          $sum: {
            $cond: [
              '$_overview.is_completed',
              '$_overview.shopee_fee',
              0,
            ],
          },
        },
        seller_discount: {
          $sum: {
            $cond: [
              '$_overview.is_completed',
              '$_overview.seller_discount',
              0,
            ],
          },
        },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: '$_id',
        orders: 1,
        potential_gross_sales: 1,
        cancelled_orders: 1,
        cancelled_gross_sales: 1,
        completed_orders: 1,
        realized_gross_sales: 1,
        net_sales: 1,
        net_profit: 1,
        shopee_fee: 1,
        seller_discount: 1,
        cancellation_rate: ratio(
          '$cancelled_orders',
          '$orders'
        ),
        sales_realization_rate: ratio(
          '$realized_gross_sales',
          '$potential_gross_sales'
        ),
        net_margin: ratio('$net_profit', '$net_sales'),
      },
    },
  ];

const cancellationByActorPipeline =
  (): PipelineStage.FacetPipelineStage[] => [
    { $match: { '_overview.is_cancelled': true } },
    {
      $group: {
        _id: '$_overview.cancelled_by',
        orders: { $sum: 1 },
        cancelled_gross_sales: {
          $sum: '$_overview.potential_gross_sales',
        },
      },
    },
    {
      $project: {
        _id: 0,
        cancelled_by: { $ifNull: ['$_id', 'unknown'] },
        orders: 1,
        cancelled_gross_sales: 1,
      },
    },
    { $sort: { cancelled_gross_sales: -1 } },
  ];

const cancellationByReasonPipeline =
  (): PipelineStage.FacetPipelineStage[] => [
    { $match: { '_overview.is_cancelled': true } },
    {
      $group: {
        _id: '$_overview.cancellation_reason',
        orders: { $sum: 1 },
        cancelled_gross_sales: {
          $sum: '$_overview.potential_gross_sales',
        },
      },
    },
    {
      $project: {
        _id: 0,
        reason: { $ifNull: ['$_id', 'Unknown'] },
        orders: 1,
        cancelled_gross_sales: 1,
      },
    },
    { $sort: { cancelled_gross_sales: -1 } },
    { $limit: 20 },
  ];

const ratio = (value: unknown, total: unknown) => ({
  $cond: [
    { $gt: [total, 0] },
    { $divide: [value, total] },
    0,
  ],
});

const emptyOverviewSummary = () => ({
  potential_gross_sales: 0,
  realized_gross_sales: 0,
  cancelled_gross_sales: 0,
  in_progress_gross_sales: 0,
  return_refund_gross_sales: 0,
  net_sales: 0,
  total_payment: 0,
  released_funds: 0,
  cogs: 0,
  gross_profit: 0,
  net_profit: 0,
  seller_voucher: 0,
  seller_bundle_discount: 0,
  seller_discount: 0,
  shopee_voucher: 0,
  shopee_bundle_discount: 0,
  shopee_discount: 0,
  shopee_fee: 0,
  marketplace_deduction: 0,
  total_discount: 0,
  total_orders: 0,
  completed_orders: 0,
  cancelled_orders: 0,
  in_progress_orders: 0,
  return_refund_orders: 0,
  total_buyers: 0,
  completed_buyers: 0,
  total_units: 0,
  completed_units: 0,
  total_items: 0,
  completed_items: 0,
  average_order_value: 0,
  profit_per_order: 0,
  gross_margin: 0,
  net_margin: 0,
  fee_ratio: 0,
  seller_discount_ratio: 0,
  shopee_discount_ratio: 0,
  cancellation_rate_by_orders: 0,
  cancellation_rate_by_value: 0,
  sales_realization_rate: 0,
  net_sales_coverage: 0,
  net_profit_coverage: 0,
  released_funds_coverage: 0,
  voucher_codes: [],
});
