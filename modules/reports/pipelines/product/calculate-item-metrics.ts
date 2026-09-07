import type { PipelineStage } from 'mongoose';

export const calculateProductItemMetrics =
  (): PipelineStage.AddFields => ({
    $addFields: {
      '_analytics.item_discount': {
        $max: [
          0,
          {
            $multiply: [
              {
                $subtract: [
                  {
                    $ifNull: ['$items.original_price', 0],
                  },
                  {
                    $ifNull: [
                      '$items.price_after_discount',
                      0,
                    ],
                  },
                ],
              },
              { $ifNull: ['$_analytics.quantity', 0] },
            ],
          },
        ],
      },
      '_analytics.marketplace_deduction': {
        $subtract: [
          { $ifNull: ['$_analytics.item_gross_sales', 0] },
          { $ifNull: ['$_analytics.item_net_sales', 0] },
        ],
      },
      '_analytics.calculated_gross_profit': {
        $subtract: [
          { $ifNull: ['$_analytics.item_gross_sales', 0] },
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
