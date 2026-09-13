import { ORDER_PLATFORMS } from '@/constant/order-platform';
import { SHOPEE_ORDER_STATUS } from '@/constant/order/shopee/status';
import { type TimeZone } from '@/constant/timezone';
import { AggregateBuilder } from '@/modules/reports/@shared/aggregate/builder';
import { getReportDateRange } from '@/lib/utils/date/report-range';
import {
  differenceInCalendarDays,
  endOfDay,
  parseISO,
  startOfDay,
} from 'date-fns';
import { Types, type PipelineStage } from 'mongoose';

const DEFAULT_DATE_FIELD = 'placed_at';
const REPORTABLE_SHOPEE_ORDER_STATUSES = [
  SHOPEE_ORDER_STATUS.completed.value,
] as const;

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

export const aggregateVoucherReport = ({
  filterBy = DEFAULT_DATE_FIELD,
  startDate,
  endDate,
  tenantContext,
  tz,
}: Args): PipelineStage[] => {
  const periodDays = Math.max(
    1,
    differenceInCalendarDays(
      endOfDay(parseISO(endDate)),
      startOfDay(parseISO(startDate))
    ) + 1
  );
  const dateRange = getReportDateRange(
    startDate,
    endDate,
    tz
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
        status: {
          $in: [...REPORTABLE_SHOPEE_ORDER_STATUSES],
        },
        [filterBy]: {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate,
        },
      },
    })
    .with(normalizeVoucherOrder(filterBy, tz))
    .with({
      $facet: {
        summary:
          summarizeVoucherOrders() as PipelineStage.FacetPipelineStage[],
        vouchers: [
          groupByVoucher(),
          ...(addVoucherMetrics() as PipelineStage.FacetPipelineStage[]),
          { $sort: { net_profit: -1, net_sales: -1 } },
          { $limit: 50 },
        ],
      },
    })
    .with({
      $project: {
        _id: 0,
        summary: {
          $ifNull: [
            { $arrayElemAt: ['$summary', 0] },
            emptyVoucherSummary(),
          ],
        },
        vouchers: 1,
        meta: {
          start_date: startDate,
          end_date: endDate,
          period_days: periodDays,
        },
      },
    })
    .build();
};

const normalizeVoucherOrder = <F extends string>(
  field: F,
  timezone: TimeZone
): PipelineStage.AddFields => ({
  $addFields: {
    _voucher_report: {
      order_id: '$order_id',
      username: '$username',
      order_date: `$${field}`,
      order_date_local: {
        $dateToString: {
          format: '%Y-%m-%d',
          date: `$${field}`,
          timezone: tzMap[timezone],
        },
      },
      voucher_code: {
        $trim: {
          input: { $ifNull: ['$voucher_code', ''] },
        },
      },
      gross_sales: {
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
      bundle_seller_discount: {
        $ifNull: ['$bundle_deal_discount_from_seller', 0],
      },
      bundle_shopee_discount: {
        $ifNull: ['$bundle_deal_discount_from_shopee', 0],
      },
      campaign_fee: {
        $abs: { $ifNull: ['$fee.campaign_fee', 0] },
      },
      affiliate_fee: {
        $abs: { $ifNull: ['$fee.affiliate_fee', 0] },
      },
    },
  },
});

const summarizeVoucherOrders = (): PipelineStage[] => [
  {
    $group: {
      _id: null,
      total_orders: { $sum: 1 },
      voucher_orders: {
        $sum: { $cond: [hasVoucherSignal(), 1, 0] },
      },
      total_gross_sales: {
        $sum: '$_voucher_report.gross_sales',
      },
      total_net_sales: {
        $sum: '$_voucher_report.net_sales',
      },
      total_net_profit: {
        $sum: '$_voucher_report.net_profit',
      },
      total_payment: {
        $sum: '$_voucher_report.total_payment',
      },
      seller_discount: {
        $sum: '$_voucher_report.seller_discount',
      },
      shopee_discount: {
        $sum: '$_voucher_report.shopee_discount',
      },
      campaign_fee: {
        $sum: '$_voucher_report.campaign_fee',
      },
      affiliate_fee: {
        $sum: '$_voucher_report.affiliate_fee',
      },
      voucher_codes: {
        $addToSet: {
          $cond: [
            { $ne: ['$_voucher_report.voucher_code', ''] },
            '$_voucher_report.voucher_code',
            '$$REMOVE',
          ],
        },
      },
    },
  },
  {
    $project: {
      _id: 0,
      total_orders: 1,
      voucher_orders: 1,
      non_voucher_orders: {
        $subtract: ['$total_orders', '$voucher_orders'],
      },
      voucher_order_rate: {
        $cond: [
          { $gt: ['$total_orders', 0] },
          { $divide: ['$voucher_orders', '$total_orders'] },
          0,
        ],
      },
      total_gross_sales: 1,
      total_net_sales: 1,
      total_net_profit: 1,
      total_payment: 1,
      seller_discount: 1,
      shopee_discount: 1,
      total_discount: {
        $add: ['$seller_discount', '$shopee_discount'],
      },
      seller_discount_share: {
        $cond: [
          {
            $gt: [
              {
                $add: [
                  '$seller_discount',
                  '$shopee_discount',
                ],
              },
              0,
            ],
          },
          {
            $divide: [
              '$seller_discount',
              {
                $add: [
                  '$seller_discount',
                  '$shopee_discount',
                ],
              },
            ],
          },
          0,
        ],
      },
      discount_ratio: {
        $cond: [
          { $gt: ['$total_gross_sales', 0] },
          {
            $divide: [
              {
                $add: [
                  '$seller_discount',
                  '$shopee_discount',
                ],
              },
              '$total_gross_sales',
            ],
          },
          0,
        ],
      },
      net_margin: {
        $cond: [
          { $gt: ['$total_net_sales', 0] },
          {
            $divide: [
              '$total_net_profit',
              '$total_net_sales',
            ],
          },
          0,
        ],
      },
      campaign_fee: 1,
      affiliate_fee: 1,
      voucher_codes_count: { $size: '$voucher_codes' },
    },
  },
];

const groupByVoucher = (): PipelineStage.Group => ({
  $group: {
    _id: {
      $switch: {
        branches: [
          {
            case: {
              $ne: ['$_voucher_report.voucher_code', ''],
            },
            then: '$_voucher_report.voucher_code',
          },
          {
            case: hasVoucherSignal(),
            then: 'Discount Without Code',
          },
        ],
        default: 'No Voucher',
      },
    },
    orders: { $sum: 1 },
    buyers: { $addToSet: '$_voucher_report.username' },
    gross_sales: { $sum: '$_voucher_report.gross_sales' },
    net_sales: { $sum: '$_voucher_report.net_sales' },
    total_payment: {
      $sum: '$_voucher_report.total_payment',
    },
    net_profit: { $sum: '$_voucher_report.net_profit' },
    seller_discount: {
      $sum: '$_voucher_report.seller_discount',
    },
    shopee_discount: {
      $sum: '$_voucher_report.shopee_discount',
    },
    bundle_seller_discount: {
      $sum: '$_voucher_report.bundle_seller_discount',
    },
    bundle_shopee_discount: {
      $sum: '$_voucher_report.bundle_shopee_discount',
    },
    campaign_fee: { $sum: '$_voucher_report.campaign_fee' },
    affiliate_fee: {
      $sum: '$_voucher_report.affiliate_fee',
    },
  },
});

const addVoucherMetrics = (): PipelineStage[] => [
  {
    $project: {
      _id: 0,
      voucher_code: '$_id',
      orders: 1,
      buyers: { $size: '$buyers' },
      gross_sales: 1,
      net_sales: 1,
      total_payment: 1,
      net_profit: 1,
      seller_discount: 1,
      shopee_discount: 1,
      bundle_seller_discount: 1,
      bundle_shopee_discount: 1,
      campaign_fee: 1,
      affiliate_fee: 1,
      total_discount: {
        $add: ['$seller_discount', '$shopee_discount'],
      },
      average_order_value: {
        $cond: [
          { $gt: ['$orders', 0] },
          { $divide: ['$total_payment', '$orders'] },
          0,
        ],
      },
      net_margin: {
        $cond: [
          { $gt: ['$net_sales', 0] },
          { $divide: ['$net_profit', '$net_sales'] },
          0,
        ],
      },
      discount_ratio: {
        $cond: [
          { $gt: ['$gross_sales', 0] },
          {
            $divide: [
              {
                $add: [
                  '$seller_discount',
                  '$shopee_discount',
                ],
              },
              '$gross_sales',
            ],
          },
          0,
        ],
      },
      seller_discount_share: {
        $cond: [
          {
            $gt: [
              {
                $add: [
                  '$seller_discount',
                  '$shopee_discount',
                ],
              },
              0,
            ],
          },
          {
            $divide: [
              '$seller_discount',
              {
                $add: [
                  '$seller_discount',
                  '$shopee_discount',
                ],
              },
            ],
          },
          0,
        ],
      },
    },
  },
  {
    $addFields: {
      classification: {
        $switch: {
          branches: [
            {
              case: { $lte: ['$net_profit', 0] },
              then: 'Margin Risk',
            },
            {
              case: { $gte: ['$net_margin', 0.2] },
              then: 'Profitable',
            },
            {
              case: { $gte: ['$orders', 5] },
              then: 'Growth Driver',
            },
          ],
          default: 'Monitor',
        },
      },
    },
  },
];

const hasVoucherSignal = () => ({
  $or: [
    { $ne: ['$_voucher_report.voucher_code', ''] },
    { $gt: ['$_voucher_report.seller_discount', 0] },
    { $gt: ['$_voucher_report.shopee_discount', 0] },
  ],
});

const emptyVoucherSummary = () => ({
  total_orders: 0,
  voucher_orders: 0,
  non_voucher_orders: 0,
  voucher_order_rate: 0,
  total_gross_sales: 0,
  total_net_sales: 0,
  total_net_profit: 0,
  total_payment: 0,
  seller_discount: 0,
  shopee_discount: 0,
  total_discount: 0,
  seller_discount_share: 0,
  discount_ratio: 0,
  net_margin: 0,
  campaign_fee: 0,
  affiliate_fee: 0,
  voucher_codes_count: 0,
});
