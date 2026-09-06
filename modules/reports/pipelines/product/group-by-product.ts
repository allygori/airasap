import type { PipelineStage } from 'mongoose';

export const groupByProduct = (): PipelineStage.Group => ({
  $group: {
    _id: {
      product_id: {
        $ifNull: [
          '$_analytics.product_id',
          'unknown-product',
        ],
      },
      variation_id: {
        $ifNull: ['$_analytics.variation_id', 'default'],
      },
    },
    product_id: { $first: '$_analytics.product_id' },
    product_name: { $first: '$_analytics.product_name' },
    variation_id: { $first: '$_analytics.variation_id' },
    variation_name: {
      $first: '$_analytics.variation_name',
    },
    parent_sku: { $first: '$_analytics.parent_sku' },
    child_sku: { $first: '$_analytics.child_sku' },
    order_ids: { $addToSet: '$_analytics.order_id' },
    units: {
      $sum: { $ifNull: ['$_analytics.final_quantity', 0] },
    },
    returned_units: {
      $sum: {
        $ifNull: ['$_analytics.returned_quantity', 0],
      },
    },
    gross_sales: {
      $sum: {
        $ifNull: ['$_analytics.item_gross_sales', 0],
      },
    },
    discount: {
      $sum: { $ifNull: ['$_analytics.item_discount', 0] },
    },
    net_sales: {
      $sum: { $ifNull: ['$_analytics.item_net_sales', 0] },
    },
    cogs: {
      $sum: { $ifNull: ['$_analytics.item_cogs', 0] },
    },
    gross_profit: {
      $sum: {
        $ifNull: [
          '$_analytics.item_gross_profit',
          '$_analytics.calculated_gross_profit',
          0,
        ],
      },
    },
    platform_fee: {
      $sum: {
        $ifNull: ['$_analytics.item_processing_fee', 0],
      },
    },
    shipping_cost: {
      $sum: 0,
    },
    other_variable_cost: {
      $sum: 0,
    },
    marketplace_deduction: {
      $sum: {
        $ifNull: ['$_analytics.marketplace_deduction', 0],
      },
    },
    net_profit: {
      $sum: {
        $ifNull: [
          '$_analytics.item_net_profit',
          '$_analytics.calculated_net_profit',
          0,
        ],
      },
    },
    top_orders: {
      $topN: {
        n: 5,
        sortBy: { '_analytics.item_net_sales': -1 },
        output: {
          order_id: '$_analytics.order_id',
          units: {
            $ifNull: ['$_analytics.final_quantity', 0],
          },
          net_sales: {
            $ifNull: ['$_analytics.item_net_sales', 0],
          },
          net_profit: {
            $ifNull: [
              '$_analytics.item_net_profit',
              '$_analytics.calculated_net_profit',
              0,
            ],
          },
          net_margin: {
            $cond: [
              {
                $ne: [
                  {
                    $ifNull: [
                      '$_analytics.item_net_sales',
                      0,
                    ],
                  },
                  0,
                ],
              },
              {
                $divide: [
                  {
                    $ifNull: [
                      '$_analytics.item_net_profit',
                      '$_analytics.calculated_net_profit',
                      0,
                    ],
                  },
                  {
                    $ifNull: [
                      '$_analytics.item_net_sales',
                      0,
                    ],
                  },
                ],
              },
              0,
            ],
          },
        },
      },
    },
    items_count: { $sum: 1 },
    items_with_stored_net_sales: {
      $sum: {
        $cond: [
          {
            $ne: [{ $type: '$items.net_sales' }, 'missing'],
          },
          1,
          0,
        ],
      },
    },
    items_with_stored_net_profit: {
      $sum: {
        $cond: [
          {
            $ne: [
              { $type: '$items.net_profit' },
              'missing',
            ],
          },
          1,
          0,
        ],
      },
    },
  },
});
