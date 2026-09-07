import type { PipelineStage } from 'mongoose';

type Args = {
  startDate: string;
  endDate: string;
  periodDays: number;
};

const safeDivide = (
  numerator: unknown,
  denominator: unknown
) => ({
  $cond: [
    { $ne: [denominator, 0] },
    { $divide: [numerator, denominator] },
    0,
  ],
});

const clamp01 = (value: unknown) => ({
  $min: [1, { $max: [0, value] }],
});

export const finalizeProductAnalytics = ({
  startDate,
  endDate,
  periodDays,
}: Args): PipelineStage.Facet => ({
  $facet: {
    products: [
      {
        $addFields: {
          orders: { $size: '$order_ids' },
          gross_margin: safeDivide(
            '$gross_profit',
            '$net_sales'
          ),
          net_margin: safeDivide(
            '$net_profit',
            '$net_sales'
          ),
          profit_per_unit: safeDivide(
            '$net_profit',
            '$units'
          ),
          sales_per_day: safeDivide(
            '$net_sales',
            periodDays
          ),
          units_per_day: safeDivide('$units', periodDays),
          orders_per_day: safeDivide(
            { $size: '$order_ids' },
            periodDays
          ),
          profit_per_day: safeDivide(
            '$net_profit',
            periodDays
          ),
          canonical_net_sales_rate: safeDivide(
            '$items_with_stored_net_sales',
            '$items_count'
          ),
          canonical_net_profit_rate: safeDivide(
            '$items_with_stored_net_profit',
            '$items_count'
          ),
        },
      },
      {
        $addFields: {
          data_quality_score: safeDivide(
            {
              $add: [
                '$canonical_net_sales_rate',
                '$canonical_net_profit_rate',
              ],
            },
            2
          ),
        },
      },
      {
        $setWindowFields: {
          sortBy: { net_sales: -1 },
          output: {
            total_net_sales: { $sum: '$net_sales' },
            total_net_profit: { $sum: '$net_profit' },
            total_units: { $sum: '$units' },
            total_product_orders: { $sum: '$orders' },
            sales_rank: { $rank: {} },
          },
        },
      },
      {
        $setWindowFields: {
          sortBy: { net_profit: -1 },
          output: {
            profit_rank: { $rank: {} },
          },
        },
      },
      {
        $setWindowFields: {
          sortBy: { units: -1 },
          output: {
            units_rank: { $rank: {} },
          },
        },
      },
      {
        $addFields: {
          sales_contribution: safeDivide(
            '$net_sales',
            '$total_net_sales'
          ),
          profit_contribution: safeDivide(
            '$net_profit',
            '$total_net_profit'
          ),
          unit_contribution: safeDivide(
            '$units',
            '$total_units'
          ),
          order_contribution: safeDivide(
            '$orders',
            '$total_product_orders'
          ),
        },
      },
      {
        $addFields: {
          opportunity_score: {
            $multiply: [
              100,
              {
                $add: [
                  {
                    $multiply: [
                      0.3,
                      clamp01('$profit_contribution'),
                    ],
                  },
                  {
                    $multiply: [
                      0.25,
                      clamp01('$sales_contribution'),
                    ],
                  },
                  {
                    $multiply: [
                      0.15,
                      clamp01('$unit_contribution'),
                    ],
                  },
                  {
                    $multiply: [
                      0.2,
                      clamp01(
                        safeDivide('$net_margin', 0.35)
                      ),
                    ],
                  },
                  {
                    $multiply: [
                      0.1,
                      clamp01('$data_quality_score'),
                    ],
                  },
                ],
              },
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
                  case: {
                    $and: [
                      { $lte: ['$sales_rank', 5] },
                      { $lte: ['$profit_rank', 5] },
                      { $gte: ['$net_margin', 0.15] },
                    ],
                  },
                  then: 'Star',
                },
                {
                  case: {
                    $and: [
                      { $lte: ['$sales_rank', 5] },
                      { $lt: ['$net_margin', 0.15] },
                    ],
                  },
                  then: 'Revenue Driver',
                },
                {
                  case: {
                    $and: [
                      { $gt: ['$sales_rank', 5] },
                      { $lte: ['$profit_rank', 5] },
                    ],
                  },
                  then: 'Profit Driver',
                },
              ],
              default: 'Weak',
            },
          },
          opportunity_label: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [
                      { $gte: ['$opportunity_score', 45] },
                      { $gt: ['$net_profit', 0] },
                      { $gte: ['$net_margin', 0.15] },
                    ],
                  },
                  then: 'Scale',
                },
                {
                  case: {
                    $and: [
                      { $gte: ['$opportunity_score', 30] },
                      { $gt: ['$net_profit', 0] },
                    ],
                  },
                  then: 'Optimize',
                },
                {
                  case: {
                    $or: [
                      { $lt: ['$net_profit', 0] },
                      { $lt: ['$net_margin', 0.05] },
                    ],
                  },
                  then: 'Fix Margin',
                },
              ],
              default: 'Monitor',
            },
          },
        },
      },
      {
        $sort: {
          opportunity_score: -1,
          net_sales: -1,
          net_profit: -1,
          product_name: 1,
        },
      },
      {
        $project: {
          _id: 0,
          order_ids: 0,
          orders: 0,
          total_net_sales: 0,
          total_net_profit: 0,
          total_units: 0,
          total_product_orders: 0,
        },
      },
    ],
    summary: [
      {
        $group: {
          _id: null,
          total_products: { $sum: 1 },
          total_orders: { $sum: { $size: '$order_ids' } },
          order_sets: { $push: '$orders' },
          total_units: { $sum: '$units' },
          returned_units: { $sum: '$returned_units' },
          gross_sales: { $sum: '$gross_sales' },
          discount: { $sum: '$discount' },
          net_sales: { $sum: '$net_sales' },
          cogs: { $sum: '$cogs' },
          gross_profit: { $sum: '$gross_profit' },
          platform_fee: { $sum: '$platform_fee' },
          shipping_cost: { $sum: '$shipping_cost' },
          other_variable_cost: {
            $sum: '$other_variable_cost',
          },
          marketplace_deduction: {
            $sum: '$marketplace_deduction',
          },
          net_profit: { $sum: '$net_profit' },
          total_items: { $sum: '$items_count' },
          items_with_stored_net_sales: {
            $sum: '$items_with_stored_net_sales',
          },
          items_with_stored_net_profit: {
            $sum: '$items_with_stored_net_profit',
          },
        },
      },
      {
        $addFields: {
          distinct_orders: {
            $reduce: {
              input: '$order_sets',
              initialValue: [],
              in: {
                $setUnion: ['$$value', '$$this'],
              },
            },
          },
          gross_margin: safeDivide(
            '$gross_profit',
            '$net_sales'
          ),
          net_margin: safeDivide(
            '$net_profit',
            '$net_sales'
          ),
          canonical_net_sales_rate: safeDivide(
            '$items_with_stored_net_sales',
            '$total_items'
          ),
          canonical_net_profit_rate: safeDivide(
            '$items_with_stored_net_profit',
            '$total_items'
          ),
          data_quality_score: safeDivide(
            {
              $add: [
                safeDivide(
                  '$items_with_stored_net_sales',
                  '$total_items'
                ),
                safeDivide(
                  '$items_with_stored_net_profit',
                  '$total_items'
                ),
              ],
            },
            2
          ),
        },
      },
      {
        $addFields: {
          distinct_completed_orders: {
            $size: '$distinct_orders',
          },
          product_order_count: '$total_orders',
          total_gross_sales: {
            $sum: '$distinct_orders.gross_sales',
          },
          total_payment: {
            $sum: '$distinct_orders.total_payment',
          },
          total_shopee_fee: {
            $sum: '$distinct_orders.shopee_fee',
          },
          seller_discount: {
            $sum: '$distinct_orders.seller_discount',
          },
          shopee_discount: {
            $sum: '$distinct_orders.shopee_discount',
          },
          voucher_codes: {
            $filter: {
              input: '$distinct_orders.voucher_code',
              as: 'voucherCode',
              cond: {
                $and: [
                  { $ne: ['$$voucherCode', null] },
                  { $ne: ['$$voucherCode', ''] },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          order_sets: 0,
          distinct_orders: 0,
        },
      },
    ],
    meta: [
      {
        $count: 'total_products',
      },
      {
        $addFields: {
          start_date: startDate,
          end_date: endDate,
          period_days: periodDays,
        },
      },
    ],
  },
});

export const projectProductAnalyticsResult =
  (): PipelineStage.Project => ({
    $project: {
      _id: 0,
      products: 1,
      summary: {
        $ifNull: [
          { $arrayElemAt: ['$summary', 0] },
          {
            total_products: 0,
            total_orders: 0,
            product_order_count: 0,
            distinct_completed_orders: 0,
            total_units: 0,
            returned_units: 0,
            gross_sales: 0,
            total_gross_sales: 0,
            total_payment: 0,
            total_shopee_fee: 0,
            seller_discount: 0,
            shopee_discount: 0,
            voucher_codes: [],
            discount: 0,
            net_sales: 0,
            cogs: 0,
            gross_profit: 0,
            platform_fee: 0,
            shipping_cost: 0,
            other_variable_cost: 0,
            marketplace_deduction: 0,
            net_profit: 0,
            gross_margin: 0,
            net_margin: 0,
            total_items: 0,
            items_with_stored_net_sales: 0,
            items_with_stored_net_profit: 0,
            canonical_net_sales_rate: 0,
            canonical_net_profit_rate: 0,
            data_quality_score: 0,
          },
        ],
      },
      meta: {
        $ifNull: [
          { $arrayElemAt: ['$meta', 0] },
          {
            total_products: 0,
            start_date: null,
            end_date: null,
            period_days: 0,
          },
        ],
      },
    },
  });
