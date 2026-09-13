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

export const aggregateOrderReport = ({
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

  const pipelines = new AggregateBuilder()
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
    .with(normalizeOrderReportOrder(filterBy, tz))
    .with({
      $facet: {
        financial: [
          {
            $match: {
              '_analytics.status': {
                $in: [...REPORTABLE_SHOPEE_ORDER_STATUSES],
              },
            },
          },
          groupDailyFinancials(),
          ...(summarizeFinancials({
            startDate,
            endDate,
            periodDays,
          }) as PipelineStage.FacetPipelineStage[]),
        ],
        status_breakdown: [
          {
            $group: {
              _id: '$_analytics.status',
              orders: { $sum: 1 },
              total_payment: {
                $sum: '$_analytics.total_payment',
              },
            },
          },
          {
            $project: {
              _id: 0,
              status: { $ifNull: ['$_id', 'unknown'] },
              orders: 1,
              total_payment: 1,
            },
          },
          { $sort: { orders: -1 } },
        ],
      },
    })
    .with({
      $project: {
        _id: 0,
        report: {
          $ifNull: [
            { $arrayElemAt: ['$financial', 0] },
            emptyFinancialReport(
              startDate,
              endDate,
              periodDays
            ),
          ],
        },
        status_breakdown: 1,
      },
    })
    .with({
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            '$report',
            { status_breakdown: '$status_breakdown' },
          ],
        },
      },
    })
    .build();

  return pipelines;
};

const normalizeOrderReportOrder = <F extends string>(
  field: F,
  timezone: TimeZone
): PipelineStage.AddFields => ({
  $addFields: {
    _analytics: {
      order_id: '$order_id',
      status: '$status',
      username: '$username',
      order_date: `$${field}`,
      order_date_local: {
        $dateToString: {
          format: '%Y-%m-%d',
          date: `$${field}`,
          timezone: tzMap[timezone],
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
      released_funds: { $ifNull: ['$released_funds', 0] },
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
      discount_from_shopee: {
        $ifNull: ['$discount_from_shopee', 0],
      },
      voucher_borne_by_shopee: {
        $ifNull: ['$voucher_borne_by_shopee', 0],
      },
      bundle_deal_discount_from_shopee: {
        $ifNull: ['$bundle_deal_discount_from_shopee', 0],
      },
      shipping_forwarded_by_shopee: {
        $ifNull: ['$shipping_cost_forwarded_by_shopee', 0],
      },
      voucher_code: { $ifNull: ['$voucher_code', null] },
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
      items_count: {
        $size: { $ifNull: ['$items', []] },
      },
      fee: {
        admin_fee: {
          $abs: { $ifNull: ['$fee.admin_fee', 0] },
        },
        processing_fee: {
          $abs: { $ifNull: ['$fee.processing_fee', 0] },
        },
        affiliate_fee: {
          $abs: { $ifNull: ['$fee.affiliate_fee', 0] },
        },
        gox_fee: { $abs: { $ifNull: ['$fee.gox_fee', 0] } },
        service_fee: {
          $abs: { $ifNull: ['$fee.service_fee', 0] },
        },
        transaction_fee: {
          $abs: { $ifNull: ['$fee.transaction_fee', 0] },
        },
        campaign_fee: {
          $abs: { $ifNull: ['$fee.campaign_fee', 0] },
        },
        shipping_saver_program_fee: {
          $abs: {
            $ifNull: ['$fee.shipping_saver_program_fee', 0],
          },
        },
        other_fee: {
          $abs: { $ifNull: ['$fee.other_fee', 0] },
        },
        premium_fee: {
          $abs: { $ifNull: ['$fee.premium_fee', 0] },
        },
        fbs_fee: { $abs: { $ifNull: ['$fee.fbs_fee', 0] } },
        tax_pph22: {
          $abs: { $ifNull: ['$fee.tax_pph22', 0] },
        },
        import_duty_vat_income_tax: {
          $abs: {
            $ifNull: ['$fee.import_duty_vat_income_tax', 0],
          },
        },
        auto_top_up_fee_from_income: {
          $abs: {
            $ifNull: [
              '$fee.auto_top_up_fee_from_income',
              0,
            ],
          },
        },
        return_shipping_fee: {
          $abs: {
            $ifNull: ['$fee.return_shipping_fee', 0],
          },
        },
        return_to_sender_shipping_fee: {
          $abs: {
            $ifNull: [
              '$fee.return_to_sender_shipping_fee',
              0,
            ],
          },
        },
        shipping_fee_refund: {
          $abs: {
            $ifNull: ['$fee.shipping_fee_refund', 0],
          },
        },
      },
      has_total_gross_sales: {
        $cond: [
          { $ne: ['$total_gross_sales', null] },
          1,
          0,
        ],
      },
      has_total_net_sales: {
        $cond: [{ $ne: ['$total_net_sales', null] }, 1, 0],
      },
      has_total_net_profit: {
        $cond: [{ $ne: ['$total_net_profit', null] }, 1, 0],
      },
      has_released_funds: {
        $cond: [{ $ne: ['$released_funds', null] }, 1, 0],
      },
    },
  },
});

const feeTotalExpression = {
  $add: [
    '$_analytics.fee.admin_fee',
    '$_analytics.fee.processing_fee',
    '$_analytics.fee.affiliate_fee',
    '$_analytics.fee.gox_fee',
    '$_analytics.fee.service_fee',
    '$_analytics.fee.transaction_fee',
    '$_analytics.fee.campaign_fee',
    '$_analytics.fee.shipping_saver_program_fee',
    '$_analytics.fee.other_fee',
    '$_analytics.fee.premium_fee',
    '$_analytics.fee.fbs_fee',
    '$_analytics.fee.tax_pph22',
    '$_analytics.fee.import_duty_vat_income_tax',
    '$_analytics.fee.auto_top_up_fee_from_income',
    '$_analytics.fee.return_shipping_fee',
    '$_analytics.fee.return_to_sender_shipping_fee',
    '$_analytics.fee.shipping_fee_refund',
  ],
};

const groupDailyFinancials = (): PipelineStage.Group => ({
  $group: {
    _id: '$_analytics.order_date_local',
    gross_sales: { $sum: '$_analytics.gross_sales' },
    net_sales: { $sum: '$_analytics.net_sales' },
    total_payment: { $sum: '$_analytics.total_payment' },
    released_funds: { $sum: '$_analytics.released_funds' },
    cogs: { $sum: '$_analytics.cogs' },
    gross_profit: { $sum: '$_analytics.gross_profit' },
    net_profit: { $sum: '$_analytics.net_profit' },
    seller_discount: {
      $sum: '$_analytics.seller_discount',
    },
    shopee_discount: {
      $sum: '$_analytics.shopee_discount',
    },
    discount_from_shopee: {
      $sum: '$_analytics.discount_from_shopee',
    },
    voucher_borne_by_shopee: {
      $sum: '$_analytics.voucher_borne_by_shopee',
    },
    bundle_deal_discount_from_shopee: {
      $sum: '$_analytics.bundle_deal_discount_from_shopee',
    },
    shipping_forwarded_by_shopee: {
      $sum: '$_analytics.shipping_forwarded_by_shopee',
    },
    shopee_fee: { $sum: feeTotalExpression },
    units: { $sum: '$_analytics.units' },
    items_count: { $sum: '$_analytics.items_count' },
    orders: { $sum: 1 },
    buyers: { $addToSet: '$_analytics.username' },
    voucher_codes: {
      $addToSet: {
        $cond: [
          { $ne: ['$_analytics.voucher_code', null] },
          '$_analytics.voucher_code',
          '$$REMOVE',
        ],
      },
    },
    admin_fee: { $sum: '$_analytics.fee.admin_fee' },
    processing_fee: {
      $sum: '$_analytics.fee.processing_fee',
    },
    affiliate_fee: {
      $sum: '$_analytics.fee.affiliate_fee',
    },
    gox_fee: { $sum: '$_analytics.fee.gox_fee' },
    service_fee: { $sum: '$_analytics.fee.service_fee' },
    transaction_fee: {
      $sum: '$_analytics.fee.transaction_fee',
    },
    campaign_fee: { $sum: '$_analytics.fee.campaign_fee' },
    shipping_saver_program_fee: {
      $sum: '$_analytics.fee.shipping_saver_program_fee',
    },
    other_fee: { $sum: '$_analytics.fee.other_fee' },
    premium_fee: { $sum: '$_analytics.fee.premium_fee' },
    fbs_fee: { $sum: '$_analytics.fee.fbs_fee' },
    tax_pph22: { $sum: '$_analytics.fee.tax_pph22' },
    import_duty_vat_income_tax: {
      $sum: '$_analytics.fee.import_duty_vat_income_tax',
    },
    auto_top_up_fee_from_income: {
      $sum: '$_analytics.fee.auto_top_up_fee_from_income',
    },
    return_shipping_fee: {
      $sum: '$_analytics.fee.return_shipping_fee',
    },
    return_to_sender_shipping_fee: {
      $sum: '$_analytics.fee.return_to_sender_shipping_fee',
    },
    shipping_fee_refund: {
      $sum: '$_analytics.fee.shipping_fee_refund',
    },
    data_quality: {
      $push: {
        has_total_gross_sales:
          '$_analytics.has_total_gross_sales',
        has_total_net_sales:
          '$_analytics.has_total_net_sales',
        has_total_net_profit:
          '$_analytics.has_total_net_profit',
        has_released_funds:
          '$_analytics.has_released_funds',
      },
    },
  },
});

const summarizeFinancials = ({
  startDate,
  endDate,
  periodDays,
}: {
  startDate: string;
  endDate: string;
  periodDays: number;
}): PipelineStage[] => [
  { $sort: { _id: 1 } },
  {
    $group: {
      _id: null,
      gross_sales: { $sum: '$gross_sales' },
      net_sales: { $sum: '$net_sales' },
      total_payment: { $sum: '$total_payment' },
      released_funds: { $sum: '$released_funds' },
      cogs: { $sum: '$cogs' },
      gross_profit: { $sum: '$gross_profit' },
      net_profit: { $sum: '$net_profit' },
      seller_discount: { $sum: '$seller_discount' },
      shopee_discount: { $sum: '$shopee_discount' },
      discount_from_shopee: {
        $sum: '$discount_from_shopee',
      },
      voucher_borne_by_shopee: {
        $sum: '$voucher_borne_by_shopee',
      },
      bundle_deal_discount_from_shopee: {
        $sum: '$bundle_deal_discount_from_shopee',
      },
      shipping_forwarded_by_shopee: {
        $sum: '$shipping_forwarded_by_shopee',
      },
      shopee_fee: { $sum: '$shopee_fee' },
      total_units: { $sum: '$units' },
      total_items: { $sum: '$items_count' },
      total_orders: { $sum: '$orders' },
      daily_reports: {
        $push: {
          date: '$_id',
          gross_sales: '$gross_sales',
          net_sales: '$net_sales',
          total_payment: '$total_payment',
          released_funds: '$released_funds',
          cogs: '$cogs',
          gross_profit: '$gross_profit',
          net_profit: '$net_profit',
          seller_discount: '$seller_discount',
          shopee_discount: '$shopee_discount',
          shopee_fee: '$shopee_fee',
          units: '$units',
          orders: '$orders',
          net_margin: {
            $cond: [
              { $gt: ['$net_sales', 0] },
              { $divide: ['$net_profit', '$net_sales'] },
              0,
            ],
          },
        },
      },
      daily_buyers: { $push: '$buyers' },
      daily_voucher_codes: { $push: '$voucher_codes' },
      admin_fee: { $sum: '$admin_fee' },
      processing_fee: { $sum: '$processing_fee' },
      affiliate_fee: { $sum: '$affiliate_fee' },
      gox_fee: { $sum: '$gox_fee' },
      service_fee: { $sum: '$service_fee' },
      transaction_fee: { $sum: '$transaction_fee' },
      campaign_fee: { $sum: '$campaign_fee' },
      shipping_saver_program_fee: {
        $sum: '$shipping_saver_program_fee',
      },
      other_fee: { $sum: '$other_fee' },
      premium_fee: { $sum: '$premium_fee' },
      fbs_fee: { $sum: '$fbs_fee' },
      tax_pph22: { $sum: '$tax_pph22' },
      import_duty_vat_income_tax: {
        $sum: '$import_duty_vat_income_tax',
      },
      auto_top_up_fee_from_income: {
        $sum: '$auto_top_up_fee_from_income',
      },
      return_shipping_fee: { $sum: '$return_shipping_fee' },
      return_to_sender_shipping_fee: {
        $sum: '$return_to_sender_shipping_fee',
      },
      shipping_fee_refund: { $sum: '$shipping_fee_refund' },
      data_quality: { $push: '$data_quality' },
    },
  },
  {
    $project: {
      _id: 0,
      summary: {
        total_orders: '$total_orders',
        total_buyers: {
          $size: {
            $reduce: {
              input: '$daily_buyers',
              initialValue: [],
              in: { $setUnion: ['$$value', '$$this'] },
            },
          },
        },
        total_units: '$total_units',
        total_items: '$total_items',
        gross_sales: '$gross_sales',
        net_sales: '$net_sales',
        total_payment: '$total_payment',
        released_funds: '$released_funds',
        cogs: '$cogs',
        gross_profit: '$gross_profit',
        net_profit: '$net_profit',
        seller_discount: '$seller_discount',
        shopee_discount: '$shopee_discount',
        discount_from_shopee: '$discount_from_shopee',
        voucher_borne_by_shopee: '$voucher_borne_by_shopee',
        bundle_deal_discount_from_shopee:
          '$bundle_deal_discount_from_shopee',
        shipping_forwarded_by_shopee:
          '$shipping_forwarded_by_shopee',
        shopee_fee: '$shopee_fee',
        marketplace_deduction: {
          $max: [
            { $subtract: ['$gross_sales', '$net_sales'] },
            0,
          ],
        },
        average_order_value: {
          $cond: [
            { $gt: ['$total_orders', 0] },
            {
              $divide: ['$total_payment', '$total_orders'],
            },
            0,
          ],
        },
        profit_per_order: {
          $cond: [
            { $gt: ['$total_orders', 0] },
            { $divide: ['$net_profit', '$total_orders'] },
            0,
          ],
        },
        gross_margin: {
          $cond: [
            { $gt: ['$gross_sales', 0] },
            { $divide: ['$gross_profit', '$gross_sales'] },
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
        fee_ratio: {
          $cond: [
            { $gt: ['$gross_sales', 0] },
            { $divide: ['$shopee_fee', '$gross_sales'] },
            0,
          ],
        },
        seller_discount_ratio: {
          $cond: [
            { $gt: ['$gross_sales', 0] },
            {
              $divide: ['$seller_discount', '$gross_sales'],
            },
            0,
          ],
        },
        shopee_discount_ratio: {
          $cond: [
            { $gt: ['$gross_sales', 0] },
            {
              $divide: ['$shopee_discount', '$gross_sales'],
            },
            0,
          ],
        },
        voucher_codes: {
          $reduce: {
            input: '$daily_voucher_codes',
            initialValue: [],
            in: { $setUnion: ['$$value', '$$this'] },
          },
        },
      },
      daily_reports: 1,
      fee_breakdown: {
        admin_fee: '$admin_fee',
        processing_fee: '$processing_fee',
        affiliate_fee: '$affiliate_fee',
        gox_fee: '$gox_fee',
        service_fee: '$service_fee',
        transaction_fee: '$transaction_fee',
        campaign_fee: '$campaign_fee',
        shipping_saver_program_fee:
          '$shipping_saver_program_fee',
        other_fee: '$other_fee',
        premium_fee: '$premium_fee',
        fbs_fee: '$fbs_fee',
        tax_pph22: '$tax_pph22',
        import_duty_vat_income_tax:
          '$import_duty_vat_income_tax',
        auto_top_up_fee_from_income:
          '$auto_top_up_fee_from_income',
        return_shipping_fee: '$return_shipping_fee',
        return_to_sender_shipping_fee:
          '$return_to_sender_shipping_fee',
        shipping_fee_refund: '$shipping_fee_refund',
      },
      data_quality: buildDataQualityProjection(),
      meta: {
        start_date: { $literal: startDate },
        end_date: { $literal: endDate },
        period_days: { $literal: periodDays },
      },
    },
  },
];

const buildDataQualityProjection = () => ({
  total_orders: '$total_orders',
  gross_sales_coverage: buildCoverageExpression(
    'has_total_gross_sales'
  ),
  net_sales_coverage: buildCoverageExpression(
    'has_total_net_sales'
  ),
  net_profit_coverage: buildCoverageExpression(
    'has_total_net_profit'
  ),
  released_funds_coverage: buildCoverageExpression(
    'has_released_funds'
  ),
});

const buildCoverageExpression = (field: string) => ({
  $let: {
    vars: {
      rows: {
        $reduce: {
          input: '$data_quality',
          initialValue: [],
          in: { $concatArrays: ['$$value', '$$this'] },
        },
      },
    },
    in: {
      $cond: [
        { $gt: [{ $size: '$$rows' }, 0] },
        {
          $divide: [
            {
              $sum: {
                $map: {
                  input: '$$rows',
                  as: 'row',
                  in: { $ifNull: [`$$row.${field}`, 0] },
                },
              },
            },
            { $size: '$$rows' },
          ],
        },
        0,
      ],
    },
  },
});

const emptyFinancialReport = (
  startDate: string,
  endDate: string,
  periodDays: number
) => ({
  summary: {
    total_orders: 0,
    total_buyers: 0,
    total_units: 0,
    total_items: 0,
    gross_sales: 0,
    net_sales: 0,
    total_payment: 0,
    released_funds: 0,
    cogs: 0,
    gross_profit: 0,
    net_profit: 0,
    seller_discount: 0,
    shopee_discount: 0,
    discount_from_shopee: 0,
    voucher_borne_by_shopee: 0,
    bundle_deal_discount_from_shopee: 0,
    shipping_forwarded_by_shopee: 0,
    shopee_fee: 0,
    marketplace_deduction: 0,
    average_order_value: 0,
    profit_per_order: 0,
    gross_margin: 0,
    net_margin: 0,
    fee_ratio: 0,
    seller_discount_ratio: 0,
    shopee_discount_ratio: 0,
    voucher_codes: [],
  },
  daily_reports: [],
  fee_breakdown: {},
  data_quality: {
    total_orders: 0,
    gross_sales_coverage: 0,
    net_sales_coverage: 0,
    net_profit_coverage: 0,
    released_funds_coverage: 0,
  },
  meta: {
    start_date: startDate,
    end_date: endDate,
    period_days: periodDays,
  },
});
