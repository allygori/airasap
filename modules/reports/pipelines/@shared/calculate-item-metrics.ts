import type { PipelineStage } from 'mongoose';

export const calculateProductItemMetrics =
  (): PipelineStage.AddFields => ({
    $addFields: {
      '_analytics.item_discount': {
        $max: [
          0,
          {
            $subtract: [
              {
                $ifNull: [
                  '$_analytics.item_gross_sales',
                  0,
                ],
              },
              {
                $ifNull: ['$_analytics.item_net_sales', 0],
              },
            ],
          },
        ],
      },
      '_analytics.allocation_ratio': {
        $cond: [
          {
            $gt: [
              {
                $ifNull: ['$_analytics.order_net_sales', 0],
              },
              0,
            ],
          },
          {
            $divide: [
              {
                $ifNull: ['$_analytics.item_net_sales', 0],
              },
              {
                $ifNull: ['$_analytics.order_net_sales', 0],
              },
            ],
          },
          0,
        ],
      },
    },
  });

export const allocateOrderLevelCosts =
  (): PipelineStage.AddFields => ({
    $addFields: {
      '_analytics.allocated_platform_fee': {
        $add: [
          {
            $ifNull: ['$_analytics.item_processing_fee', 0],
          },
          {
            $multiply: [
              {
                $ifNull: [
                  '$_analytics.allocation_ratio',
                  0,
                ],
              },
              {
                $ifNull: [
                  '$_analytics.order_platform_fee',
                  0,
                ],
              },
            ],
          },
        ],
      },
      '_analytics.allocated_shipping_cost': {
        $multiply: [
          { $ifNull: ['$_analytics.allocation_ratio', 0] },
          {
            $ifNull: ['$_analytics.order_shipping_cost', 0],
          },
        ],
      },
      '_analytics.allocated_other_variable_cost': {
        $multiply: [
          { $ifNull: ['$_analytics.allocation_ratio', 0] },
          {
            $ifNull: [
              '$_analytics.order_other_variable_cost',
              0,
            ],
          },
        ],
      },
    },
  });

export const calculateNetProfitAfterAllocation =
  (): PipelineStage.AddFields => ({
    $addFields: {
      '_analytics.calculated_gross_profit': {
        $subtract: [
          { $ifNull: ['$_analytics.item_net_sales', 0] },
          { $ifNull: ['$_analytics.item_cogs', 0] },
        ],
      },
      '_analytics.calculated_net_profit': {
        $subtract: [
          { $ifNull: ['$_analytics.item_net_sales', 0] },
          { $ifNull: ['$_analytics.item_cogs', 0] },
        ],
      },
    },
  });
