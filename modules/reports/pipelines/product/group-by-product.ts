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
      $sum: { $ifNull: ['$_analytics.quantity', 0] },
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
        $ifNull: ['$_analytics.allocated_platform_fee', 0],
      },
    },
    shipping_cost: {
      $sum: {
        $ifNull: ['$_analytics.allocated_shipping_cost', 0],
      },
    },
    other_variable_cost: {
      $sum: {
        $ifNull: [
          '$_analytics.allocated_other_variable_cost',
          0,
        ],
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
  },
});
