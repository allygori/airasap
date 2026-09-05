import type { PipelineStage } from 'mongoose';

type Args = {
  startDate: string;
  endDate: string;
  periodDays: number;
  reportableStatuses: string[];
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

export const finalizeProductAnalytics = ({
  startDate,
  endDate,
  periodDays,
  reportableStatuses,
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
        },
      },
      {
        $sort: {
          net_sales: -1,
          net_profit: -1,
          product_name: 1,
        },
      },
      {
        $project: {
          _id: 0,
          order_ids: 0,
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
          net_profit: { $sum: '$net_profit' },
        },
      },
      {
        $addFields: {
          gross_margin: safeDivide(
            '$gross_profit',
            '$net_sales'
          ),
          net_margin: safeDivide(
            '$net_profit',
            '$net_sales'
          ),
        },
      },
      { $project: { _id: 0 } },
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
          reportable_statuses: reportableStatuses,
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
            total_units: 0,
            returned_units: 0,
            gross_sales: 0,
            discount: 0,
            net_sales: 0,
            cogs: 0,
            gross_profit: 0,
            platform_fee: 0,
            shipping_cost: 0,
            other_variable_cost: 0,
            net_profit: 0,
            gross_margin: 0,
            net_margin: 0,
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
            reportable_statuses: [],
          },
        ],
      },
    },
  });
